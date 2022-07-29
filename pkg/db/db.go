package db

import (
	"fmt"
	config "main/pkg/dataStructures"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB_INST *gorm.DB // nolint - global db instance

type User struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// battle struct is associated to a user.
type Battle struct {
	CreatedAt            time.Time
	UpdatedAt            time.Time
	DeletedAt            gorm.DeletedAt `gorm:"index"`
	BattleID             string         `gorm:"primaryKey" json:"battle_id"`
	Opponent             string         `json:"opponent"`
	Result               string         `json:"result"`
	OpponentTeam         string         `json:"opponent_team"`
	OpponentSelected     string         `json:"opponent_selected"`
	YourTeam             string         `json:"your_team"`
	Selected             string         `json:"selected"`
	RatingBefore         string         `json:"rating_before"`
	RatingAfter          string         `json:"rating_after"`
	OpponentRatingBefore string         `json:"opponent_rating_before"`
	OpponentRatingAfter  string         `json:"opponent_rating_after"`
	Replay               string         `json:"replay"`
	Timestamp            int64          `json:"timestamp"`
	Format               string         `json:"format"`
}

func InitDB(cfg *config.Config) {
	db, err := gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	err = db.AutoMigrate(&Battle{})
	if err != nil {
		panic("failed to migrate table")
	}
	DB_INST = db

}

func GetAllBattles() []*Battle {
	if DB_INST == nil {
		return nil
	}
	// query all battles
	var battles []*Battle
	DB_INST.Order("timestamp desc").Find(&battles)
	return battles

}

func UpdateBattle(battle *Battle) error {
	if DB_INST == nil {
		return fmt.Errorf("db not initialized")
	}

	// get the current battle from the database
	var currentBattle Battle
	DB_INST.Where("battle_id = ?", battle.BattleID).First(&currentBattle)

	// update the battle ratings
	currentBattle.RatingAfter = battle.RatingAfter
	currentBattle.OpponentRatingAfter = battle.OpponentRatingAfter

	// update the battle
	if tx := DB_INST.Save(&currentBattle); tx.RowsAffected == 0 {
		return fmt.Errorf("failed to update battle")
	}
	return nil
}

func AddBattle(battle *Battle) error {
	if DB_INST == nil {
		return fmt.Errorf("db not initialized")
	}

	// add the battle to the database
	if tx := DB_INST.Create(battle); tx.RowsAffected == 0 {
		return fmt.Errorf("failed to add battle")
	}
	return nil
}

func DeleteEntries(battle_ids []string) error {
	if DB_INST == nil {
		return fmt.Errorf("db not initialized")
	}

	// delete the battles from the database
	if tx := DB_INST.Where("battle_id IN (?)", battle_ids).Delete(&Battle{}); tx.RowsAffected == 0 {
		return fmt.Errorf("failed to delete battles")
	}
	return nil
}
