package auth

import (
	"net/http"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

type JwtCustomClaims struct {
	Username       string `json:"username"`
	UserID         uint   `json:"user_id"`
	StandardClaims jwt.StandardClaims
}

// Valid verified the token is valid.
func (c JwtCustomClaims) Valid() error {
	return c.StandardClaims.Valid()
}

func IsAuth(c echo.Context) (bool, *JwtCustomClaims) {
	token, err := c.Cookie("token")
	claims := &JwtCustomClaims{}
	if err != nil {
		// try to refresh the token
		refresh_token, refresh_err := c.Cookie("refresh_token")
		if refresh_err != nil {
			return false, nil
		} else {
			_, err = jwt.ParseWithClaims(refresh_token.Value, claims, func(token *jwt.Token) (interface{}, error) {
				return []byte("psstats"), nil
			})
			if err != nil {
				return false, nil
			}

			// create a new token and refresh token
			claims, refresh_claims := CreateToken(claims.UserID, claims.Username, c) // nolint
			if claims == nil || refresh_claims == nil {
				return false, nil
			}
			return true, claims
		}
	}
	var refresh_claims *JwtCustomClaims
	_, err = jwt.ParseWithClaims(token.Value, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte("psstats"), nil
	})
	if err != nil {
		// try to refresh the token
		refresh_token, err := c.Cookie("refresh_token")
		if err != nil {
			return false, nil
		} else {
			_, err = jwt.ParseWithClaims(refresh_token.Value, claims, func(token *jwt.Token) (interface{}, error) {
				return []byte("psstats"), nil
			})
			if err != nil {
				return false, nil
			}

			// create a new token and refresh token
			claims, refresh_claims = CreateToken(claims.UserID, claims.Username, c)
			if claims == nil || refresh_claims == nil {
				return false, nil
			}
		}
	}
	return true, claims
}

func CreateToken(user_id uint, username string, c echo.Context) (*JwtCustomClaims, *JwtCustomClaims) {
	if username == "" {
		// fetch the usename from the database
		// user := &db.User{}
		// // db.DB_INST.Where("id = ?", user_id).First(user)
		// username = user.Username
		return nil, nil
	}
	claims := &JwtCustomClaims{
		Username: username,
		UserID:   user_id,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Minute * 30).Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString([]byte("psstats"))
	if err != nil {
		return nil, nil
	}

	refresh_claims := &JwtCustomClaims{
		UserID:   user_id,
		Username: username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 24).Unix(),
		},
	}
	refresh_token := jwt.NewWithClaims(jwt.SigningMethodHS256, refresh_claims)
	rt, err := refresh_token.SignedString([]byte("psstats"))
	if err != nil {
		return nil, nil
	}
	// Save t to cookie
	c.SetCookie(&http.Cookie{
		Name:     "token",
		Value:    t,
		Expires:  time.Now().Add(time.Minute * 30),
		Path:     "/",
		HttpOnly: true,
	})

	// Save refresh_token to cookie
	c.SetCookie(&http.Cookie{
		Name:     "refresh_token",
		Value:    rt,
		Expires:  time.Now().Add(time.Hour * 24),
		Path:     "/",
		HttpOnly: true,
	})

	return claims, refresh_claims
}
