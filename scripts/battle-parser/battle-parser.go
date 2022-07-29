package battle_parser

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	urllib "net/url"

	config "main/pkg/dataStructures"

	"github.com/gorilla/websocket"
	"github.com/malaow3/trunk"
	log "github.com/sirupsen/logrus"
	"github.com/tidwall/gjson"
	"golang.org/x/exp/slices"
)

func getAssertion(config *config.Config, challstr string) (string, error) {
	// make post request to https://play.pokemonshowdown.com/action.php

	body := make(map[string]string)
	body["act"] = "login"
	body["name"] = config.Username
	body["pass"] = config.Password
	body["challstr"] = strings.TrimPrefix(challstr, "|challstr|")

	body_bytes, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	resp, err := http.Post("https://play.pokemonshowdown.com/action.php", "application/json", bytes.NewBuffer(body_bytes))
	if err != nil {
		return "", err
	}

	body_data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// trim first character from body_data
	json_data := gjson.ParseBytes(body_data[1:])
	if !json_data.Get("actionsuccess").Bool() {
		return "", fmt.Errorf("%s", "Login failed")
	}

	return json_data.Get("assertion").String(), nil
}

type Battle struct {
	BattleID  string
	Player    *BattleParticipant
	Opponent  *BattleParticipant
	Result    string
	Timestamp int64
	P1        *BattleParticipant
	P2        *BattleParticipant
	Replay    string
	Format    string
	Uploaded  bool
}

type BattleParticipant struct {
	Name         string
	FullTeam     []string
	RatingBefore string
	RatingAfter  string
	SelectedMons []string
}

func login(cfg *config.Config) ([]*http.Cookie, error) {
	url := "http://127.0.0.1:1323/api/auth/login"
	method := "POST"
	type Payload struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	payload := Payload{
		Username: cfg.Username,
		Password: cfg.Password,
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	body := bytes.NewReader(payloadBytes)

	client := &http.Client{}
	req, err := http.NewRequest(method, url, body)

	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	return resp.Cookies(), nil
}

func update_rating(cfg *config.Config, battle_inst *Battle) error {
	cookies, err := login(cfg)
	if err != nil {
		return err
	}
	type Payload struct {
		BattleID            string `json:"battle_id"`
		RatingAfter         string `json:"rating_after"`
		OpponentRatingAfter string `json:"opponent_rating_after"`
	}

	payload := Payload{
		BattleID:            battle_inst.BattleID,
		RatingAfter:         battle_inst.Player.RatingAfter,
		OpponentRatingAfter: battle_inst.Opponent.RatingAfter,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	body := bytes.NewReader(payloadBytes)

	req, err := http.NewRequest("POST", "http://127.0.0.1:1323/api/battle_update", body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	_, err = http.DefaultClient.Do(req)
	return err

}

func upload_battle(cfg *config.Config, battle_inst *Battle) error {
	if battle_inst == nil {
		return fmt.Errorf("%s", "Battle is nil")
	}
	if battle_inst.Player == nil || battle_inst.Opponent == nil {
		return nil
	}

	cookies, err := login(cfg)
	if err != nil {
		return err
	}
	type Payload struct {
		BattleID             string `json:"battle_id"`
		Opponent             string `json:"opponent"`
		Result               string `json:"result"`
		YourTeam             string `json:"your_team"`
		OpponentTeam         string `json:"opponent_team"`
		RatingBefore         string `json:"rating_before"`
		RatingAfter          string `json:"rating_after"`
		OpponentRatingBefore string `json:"opponent_rating_before"`
		OpponentRatingAfter  string `json:"opponent_rating_after"`
		Timestamp            int64  `json:"timestamp"`
		Replay               string `json:"replay"`
		Format               string `json:"format"`
		Selected             string `json:"selected"`
		OpponentSelected     string `json:"opponent_selected"`
	}

	your_team_string := strings.Join(battle_inst.Player.SelectedMons, ",")
	opponent_team_string := strings.Join(battle_inst.Opponent.SelectedMons, ",")
	// add the remaining pokemon from FullTeam to your_team_string
	for _, mon := range battle_inst.Player.FullTeam {
		if !slices.Contains(battle_inst.Player.SelectedMons, mon) {
			mon = strings.TrimSuffix(mon, "-*")
			your_team_string += "," + mon
		}
	}

	// if the total number of pokemon is less than 6, add UNKNOWNMON as the rest
	if len(strings.Split(your_team_string, ",")) < 6 {
		for i := len(strings.Split(your_team_string, ",")); i < 6; i++ {
			your_team_string += ",UNKNOWNMON"
		}
	}

	for _, mon := range battle_inst.Opponent.FullTeam {
		if !slices.Contains(battle_inst.Opponent.SelectedMons, mon) {
			mon = strings.TrimSuffix(mon, "-*")
			opponent_team_string += "," + mon
		}
	}

	// if the total number of pokemon is less than 6, add UNKNOWNMON as the rest
	if len(strings.Split(opponent_team_string, ",")) < 6 {
		for i := len(strings.Split(opponent_team_string, ",")); i < 6; i++ {
			opponent_team_string += ",UNKNOWNMON"
		}
	}

	selected_str := strings.Join(battle_inst.Player.SelectedMons, ",")
	opp_selected_str := strings.Join(battle_inst.Opponent.SelectedMons, ",")
	data := Payload{
		BattleID:             battle_inst.BattleID,
		Opponent:             battle_inst.Opponent.Name,
		Result:               battle_inst.Result,
		RatingBefore:         battle_inst.Player.RatingBefore,
		RatingAfter:          battle_inst.Player.RatingAfter,
		OpponentRatingBefore: battle_inst.Opponent.RatingBefore,
		OpponentRatingAfter:  battle_inst.Opponent.RatingAfter,
		Timestamp:            battle_inst.Timestamp,
		YourTeam:             your_team_string,
		OpponentTeam:         opponent_team_string,
		Replay:               battle_inst.Replay,
		Format:               battle_inst.Format,
		Selected:             selected_str,
		OpponentSelected:     opp_selected_str,
	}
	payloadBytes, err := json.Marshal(data)
	if err != nil {
		return err
	}
	body := bytes.NewReader(payloadBytes)

	req, err := http.NewRequest("POST", "http://127.0.0.1:1323/api/battle", body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	for _, cookie := range cookies {
		req.AddCookie(cookie)
	}
	_, err = http.DefaultClient.Do(req)
	return err
}

func Parse_battles() {
	// trunk.InitLogger()
	trunk.InitLoggerNoColors()

	log.Info("Starting battle parser")

	player_info_regex := regexp.MustCompile(`(?m)\|player\|(?P<player_num>p\d)\|(?P<player_name>.*?)\|.*\|(?P<player_rating>\d*)\n?`)
	poke_regex := regexp.MustCompile(`(?m)\|poke\|(p\d)\|(.*?),.*\|`)
	switch_regex := regexp.MustCompile(`(?m)\|switch\|(p\d)\w: .*\|(.*?),`)
	win_regex := regexp.MustCompile(`(?m)\|win\|(.*)\n?`)
	rating_regex := regexp.MustCompile(`(?m)\|raw\|(.*?)'s rating: \d+ &rarr; <strong>(\d+)`)

	// connect to websocket @ wss://sim3.psim.us/showdown/websocket
	conn, _, err := websocket.DefaultDialer.Dial(
		"ws://sim3.psim.us/showdown/websocket",
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	defer conn.Close()

	cfg := config.ParseConfig()

	battles := make(map[string]*Battle)

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Fatal(err)
		}
		message_str := string(message)

		// if message is a savereplay response, let's upload it to the server
		if strings.HasPrefix(message_str, "|queryresponse|savereplay|") {
			json_str := strings.TrimPrefix(message_str, "|queryresponse|savereplay|")
			json_data := gjson.Parse(json_str)
			url := "https://play.pokemonshowdown.com/~~showdown/action.php"
			method := "POST"
			data := urllib.Values{}
			data.Set("act", "uploadreplay")
			data.Set("server", "showdown")
			data.Set("id", json_data.Get("id").String())
			data.Set("log", json_data.Get("log").String())
			data.Set("password", json_data.Get("password").String())
			encodedData := data.Encode()
			req, reqerr := http.NewRequest(method, url, strings.NewReader(encodedData))
			if reqerr != nil {
				log.Error(reqerr)
				break
			}
			client := &http.Client{
				Timeout: time.Second * 10,
			}
			req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
			req.Header.Add("Content-Length", strconv.Itoa(len(data.Encode())))
			_, err = client.Do(req)
			if err != nil {
				log.Error(err)
				break
			}
			battle_id_end := json_data.Get("id").String()
			if json_data.Get("password").String() != "" {
				battle_id_end += "-" + json_data.Get("password").String() + "pw"
			}
			battle_id := fmt.Sprintf(">battle-%s", battle_id_end)
			upload_err := upload_battle(cfg, battles[battle_id])
			if upload_err != nil {
				log.Error(upload_err)
			} else {
				delete(battles, battle_id)
			}

		}

		// log.WithFields(log.Fields{
		// 	"": "MESSAGE",
		// }).Info(message_str)

		// if the message has challstr and password is set, log in
		if strings.HasPrefix(message_str, "|challstr|") && cfg.Password != "" {
			assertion, assert_err := getAssertion(cfg, message_str)
			if assert_err != nil {
				log.Fatal(assert_err)
			}
			message := fmt.Sprintf("|/trn %s,0,%s", cfg.Username, assertion)
			err = conn.WriteMessage(websocket.TextMessage, []byte(message))
			if err != nil {
				log.Error(err)
			} else {
				// if avatar is set, send message to change avatar
				if cfg.Avatar != "" {
					message = fmt.Sprintf("|/avatar %s", cfg.Avatar)
					err = conn.WriteMessage(websocket.TextMessage, []byte(message))
					if err != nil {
						log.Error(err)
					}
				}
			}
		}

		// battle related msg
		if strings.HasPrefix(message_str, ">battle-") {
			battle_id := strings.Split(message_str, "\n")[0]
			// create new key if it doesn't exist
			if _, ok := battles[battle_id]; !ok {
				format_regex := regexp.MustCompile(`(?m)>battle-(.*?)-`)
				matches := format_regex.FindStringSubmatch(battle_id)
				var format string
				if len(matches) == 0 {
					log.Error("Could not find battle format")
				} else {
					format = matches[1]
				}
				battles[battle_id] = &Battle{
					BattleID:  battle_id,
					Timestamp: time.Now().Unix(),
					Format:    format,
					Player:    &BattleParticipant{},
					Opponent:  &BattleParticipant{},
				}
			}
			matches := player_info_regex.FindStringSubmatch(message_str)

			if strings.Contains(message_str, "|player|") {
				if len(matches) < 3 {
					// improperly formatted message
					continue
				}

				// if both players are already set, skip any incoming messages
				if battles[battle_id].Player.Name != "" && battles[battle_id].Opponent.Name != "" {
					continue
				}
				player_name := matches[player_info_regex.SubexpIndex("player_name")]
				player_num := matches[player_info_regex.SubexpIndex("player_num")]
				player_rating := matches[player_info_regex.SubexpIndex("player_rating")]

				if strings.EqualFold(player_name, cfg.Username) {
					battles[battle_id].Player = &BattleParticipant{
						Name:         player_name,
						RatingBefore: player_rating,
					}
					if player_num == "p1" {
						battles[battle_id].P1 = battles[battle_id].Player
					} else {
						battles[battle_id].P2 = battles[battle_id].Player
					}
				} else {
					battles[battle_id].Opponent = &BattleParticipant{
						Name:         player_name,
						RatingBefore: player_rating,
					}
					if player_num == "p1" {
						battles[battle_id].P1 = battles[battle_id].Opponent
					} else {
						battles[battle_id].P2 = battles[battle_id].Opponent
					}
				}
			}

			poke_matches := poke_regex.FindAllStringSubmatch(message_str, -1)
			for _, groups := range poke_matches {
				player_num := groups[1]
				poke_name := groups[2]
				if player_num == "p1" {
					battles[battle_id].P1.FullTeam = append(battles[battle_id].P1.FullTeam, poke_name)
				} else {
					battles[battle_id].P2.FullTeam = append(battles[battle_id].P2.FullTeam, poke_name)
				}
			}

			switch_matches := switch_regex.FindAllStringSubmatch(message_str, -1)
			for _, groups := range switch_matches {
				player_num := groups[1]
				poke_name := groups[2]
				if player_num == "p1" {
					// if pokemon is already in selected mons, skip
					if slices.Contains(battles[battle_id].P1.SelectedMons, poke_name) {
						continue
					}
					battles[battle_id].P1.SelectedMons = append(battles[battle_id].P1.SelectedMons, poke_name)
					// check to see if there is a pokemon in the full team that needs to be replaced with this one
					for i, poke_name_in_full_team := range battles[battle_id].P1.FullTeam {
						if poke_name_in_full_team[len(poke_name_in_full_team)-1:] == "*" &&
							strings.HasPrefix(poke_name, poke_name_in_full_team[:len(poke_name_in_full_team)-1]) {
							battles[battle_id].P1.FullTeam[i] = poke_name
						}
					}
				} else {
					if slices.Contains(battles[battle_id].P2.SelectedMons, poke_name) {
						continue
					}
					battles[battle_id].P2.SelectedMons = append(battles[battle_id].P2.SelectedMons, poke_name)
					// check to see if there is a pokemon in the full team that needs to be replaced with this one
					for i, poke_name_in_full_team := range battles[battle_id].P2.FullTeam {
						if poke_name_in_full_team[len(poke_name_in_full_team)-1:] == "*" &&
							strings.HasPrefix(poke_name, poke_name_in_full_team[:len(poke_name_in_full_team)-1]) {
							battles[battle_id].P2.FullTeam[i] = poke_name
						}
					}
				}
			}

			win_match := win_regex.FindStringSubmatch(message_str)
			if len(win_match) > 0 {
				winner := win_match[1]
				if strings.EqualFold(winner, cfg.Username) {
					battles[battle_id].Result = "win"
				} else {
					battles[battle_id].Result = "loss"
				}
				message := fmt.Sprintf("%s|/savereplay", battle_id[1:])
				err = conn.WriteMessage(websocket.TextMessage, []byte(message))
				if err != nil {
					log.Error(err)
				}
				battles[battle_id].Replay = "https://replay.pokemonshowdown.com/" + battle_id[1:]
				// leave the room
				message = fmt.Sprintf("|/noreply /leave %s", battle_id[1:])
				err = conn.WriteMessage(websocket.TextMessage, []byte(message))
				if err != nil {
					log.Error(err)
				}
			}

			rating_matches := rating_regex.FindAllStringSubmatch(message_str, -1)
			for _, groups := range rating_matches {
				player_name := groups[1]
				rating := groups[2]
				if strings.EqualFold(player_name, cfg.Username) {
					battles[battle_id].Player.RatingAfter = rating
				} else {
					battles[battle_id].Opponent.RatingAfter = rating
				}
				// once ratings are set, send a request to update the battle in the database
				if battles[battle_id].Player.RatingAfter != "" && battles[battle_id].Opponent.RatingAfter != "" {
					// if the rating_before is set, then just update the battle locally
					if battles[battle_id].Player.RatingBefore != "" && battles[battle_id].Opponent.RatingBefore != "" {
						break
					}
					err = update_rating(cfg, battles[battle_id])
					if err != nil {
						log.Error(err)
					}
					delete(battles, battle_id)
				}
			}

		}

		// if len(battles) > 0 {

		// 	battles_str, err := json.MarshalIndent(battles, "", "\t")
		// 	if err != nil {
		// 		log.Error(err)
		// 	} else {
		// 		log.WithFields(log.Fields{"": "BATTLES"}).Info("\n" + string(battles_str))
		// 	}

		// }
	}
}
