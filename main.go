package main

import (
	"embed"

	"encoding/json"
	"errors"
	"fmt"
	"io"
	"main/pkg/auth"
	config "main/pkg/dataStructures"
	"main/pkg/db"
	battleParser "main/scripts/battleParser"
	"net/http"
	"path"
	"runtime"
	"strings"
	"text/template"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/malaow3/trunk"
	echologrus "github.com/malaow3/trunk/echologrus"
	"github.com/malaow3/trunk/formatter"
	log "github.com/sirupsen/logrus"
)

// TO DO:
// - analytics

// template engine.
type Template struct {
	templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func getEchoLoggerNoColors() echologrus.Logrus {
	mylog := echologrus.Logrus{Logger: echologrus.Logger}
	mylog.SetFormatter(&formatter.Formatter{
		HideKeys:        false,
		FieldsOrder:     []string{"component", "category"},
		TimestampFormat: "2006-01-02 15:04:05.000",
		CallerFirst:     true,
		CustomCallerFormatter: func(f *runtime.Frame) string {
			s := strings.Split(f.Function, ".")
			funcName := s[len(s)-1]
			return fmt.Sprintf(" [%s:%d][%s()]", path.Base(f.File), f.Line, funcName)
		},
	})
	// mylog.SetReportCaller(true)
	return mylog
}

//go:embed react/*
var reactDir embed.FS

func main() {
	trunk.InitLogger()
	log.Info("Starting up!")

	cfg := config.ParseConfig()

	// Initialize the db
	db.InitDB(cfg)

	// create echo webserver
	e := echo.New()

	// setup logrus logger
	echologrus.Logger = log.New()
	e.Logger = getEchoLoggerNoColors()
	e.Use(echologrus.Hook())

	e.Use(middleware.Recover())

	t := &Template{
		templates: template.Must(template.ParseFS(reactDir, "react/public/views/*.html")),
	}
	e.Renderer = t
	favicon := echo.MustSubFS(reactDir, "react/public/favicon")
	e.StaticFS("/favicon", favicon)
	// e.Static("/favicon", "react/public/favicon")
	css := echo.MustSubFS(reactDir, "react/public/css")
	e.StaticFS("/css", css)
	// e.Static("/css", "react/public/css")
	js := echo.MustSubFS(reactDir, "react/public/js")
	e.StaticFS("/js", js)
	// e.Static("/js", "react/public/js")

	// Route to determine if user is logged in
	e.GET("/api/auth/isloggedin", func(c echo.Context) error {
		is_auth, claims := auth.IsAuth(c)
		if is_auth {
			log.Info("User is logged in")
			return c.JSON(http.StatusOK, echo.Map{"loggedin": true, "claims": claims})
		}
		log.Info("User is NOT logged in")
		return c.JSON(http.StatusOK, echo.Map{"loggedin": false})
	})

	e.GET("/api/battles", func(c echo.Context) error {
		is_auth, _ := auth.IsAuth(c)
		if !is_auth {
			return c.JSON(http.StatusUnauthorized, echo.Map{"battles": []db.Battle{}})
		}
		log.Info("User is logged in")

		// get all keys from the db
		battles := db.GetAllBattles()
		if battles == nil {
			battles = []*db.Battle{}
		}

		return c.JSON(http.StatusOK, echo.Map{"battles": battles})
	})

	// login route
	e.POST("/api/auth/login", func(c echo.Context) error {
		// get the username and password from the request as a JSON
		u := new(db.User)
		if err := c.Bind(u); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"status": "failed",
				"error":  err,
			})
		}

		// ensure the username and password match the expected values
		if u.Username != cfg.Username || u.Password != cfg.Password {
			return c.JSON(http.StatusUnauthorized, echo.Map{
				"status": "failed",
				"error":  errors.New("invalid username or password"),
			})
		}

		// create a new token and refresh token
		claims, refresh_claims := auth.CreateToken(u.ID, u.Username, c)
		if claims == nil || refresh_claims == nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"status": "failed",
				"error":  errors.New("failed to create token"),
			})
		}

		return c.JSON(http.StatusOK, echo.Map{"status": "success", "claims": claims, "refresh_claims": refresh_claims})
	})

	// logout route
	e.GET("/api/auth/logout", func(c echo.Context) error {
		// delete the token from cookies and redirect to home page
		// Save t to cookie
		c.SetCookie(&http.Cookie{
			Name:     "token",
			Value:    "",
			Expires:  time.Now(),
			Path:     "/",
			HttpOnly: true,
		})

		// Save refresh_token to cookie
		c.SetCookie(&http.Cookie{
			Name:     "refresh_token",
			Value:    "",
			Expires:  time.Now(),
			Path:     "/",
			HttpOnly: true,
		})

		return c.Redirect(http.StatusTemporaryRedirect, "/")
	})

	// register routes
	e.GET("/", func(c echo.Context) error {

		// Get JWT token and check if valid
		is_auth, claims := auth.IsAuth(c)
		if !is_auth {
			log.Info("User not authenticated")
		} else {
			log.Info("User authenticated: ", claims.Username)
		}

		log.Info("GET /")
		return c.Render(http.StatusOK, "test.html", nil)
	})

	// Add battle route - POST
	e.POST("/api/battle", func(c echo.Context) error {
		// verify user is logged in
		is_auth, claims := auth.IsAuth(c)
		if !is_auth {
			log.Info("User not authenticated")
			return c.JSON(http.StatusUnauthorized, echo.Map{"status": "401", "message": "User not authenticated"})
		} else {
			log.Info("User authenticated: ", claims.Username)
		}

		// get data from JSON
		data, err := io.ReadAll(c.Request().Body)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		// unmarshal JSON
		var battle db.Battle
		err = json.Unmarshal(data, &battle)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		// add battle to db
		err = db.AddBattle(&battle)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusOK, battle)

	})

	e.POST("/api/battle_update", func(c echo.Context) error {
		// verify user is logged in
		is_auth, claims := auth.IsAuth(c)
		if !is_auth {
			log.Info("User not authenticated")
			return c.JSON(http.StatusUnauthorized, echo.Map{"status": "401", "message": "User not authenticated"})
		} else {
			log.Info("User authenticated: ", claims.Username)
		}

		type Payload struct {
			BattleID            string `json:"battle_id"`
			RatingAfter         string `json:"rating_after"`
			OpponentRatingAfter string `json:"opponent_rating_after"`
		}

		// get data from JSON
		data, err := io.ReadAll(c.Request().Body)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		// unmarshal JSON
		var battle_update_payload Payload
		err = json.Unmarshal(data, &battle_update_payload)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}

		battle := db.Battle{
			BattleID:            battle_update_payload.BattleID,
			RatingAfter:         battle_update_payload.RatingAfter,
			OpponentRatingAfter: battle_update_payload.OpponentRatingAfter,
		}

		err = db.UpdateBattle(&battle)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"status": "failed", "error": err})
		}
		return c.JSON(http.StatusOK, nil)

	})

	// delete entries route
	e.POST("/api/battle_delete", func(c echo.Context) error {
		// verify user is logged in
		is_auth, claims := auth.IsAuth(c)
		if !is_auth {
			log.Info("User not authenticated")
			return c.JSON(http.StatusUnauthorized, echo.Map{"status": "401", "message": "User not authenticated"})
		} else {
			log.Info("User authenticated: ", claims.Username)
		}

		type Payload struct {
			Battle_IDs []string `json:"battle_ids"`
		}

		// get data from JSON
		data, err := io.ReadAll(c.Request().Body)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}
		payload := Payload{}
		err = json.Unmarshal(data, &payload)
		if err != nil {
			return c.String(http.StatusInternalServerError, err.Error())
		}
		battle_ids := []string{}
		for _, battle_id := range payload.Battle_IDs {
			// replace &gt; with >
			battle_id = strings.ReplaceAll(battle_id, "&gt;", ">")
			battle_ids = append(battle_ids, battle_id)
		}

		err = db.DeleteEntries(battle_ids)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"status": "failed", "error": err})
		}

		return c.JSON(http.StatusOK, echo.Map{"status": "success"})
	})

	// start the battle parser in the background
	go func() {
		log.Info("Starting battle parser")
		battleParser.ParseBattles()
	}()

	// start echo webserver
	e.Logger.Fatal(e.Start(":1323"))
}
