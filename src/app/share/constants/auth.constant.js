const authConstants = {
  LoginType: {
    Email: 10,
    Username: 20,
  },
  JwtTime: {
    AccessTonken: "15m",
    RefreshToken: "7d",
  },
  JwtMessage: {
    TokenExpriredError: "TokenExpiredError",
    TokenSignatureError: "JsonWebTokenError",
  },
  KeyCookie: {
    RefreshToken: "auth_refresh_token",
  },
};

module.exports = authConstants;
