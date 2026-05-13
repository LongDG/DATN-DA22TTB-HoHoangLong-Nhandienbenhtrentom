const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra user đã tồn tại theo googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Kiểm tra user đã tồn tại theo email (có thể đã đăng ký bằng phone trước đó)
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Cập nhật googleId và ảnh đại diện cho user đã có
          user.googleId = profile.id;
          user.anhdaidien = user.anhdaidien || profile.photos[0].value;
          await user.save();
          return done(null, user);
        }

        // Tạo user mới từ thông tin Google
        user = await User.create({
          googleId: profile.id,
          ten: profile.displayName,
          email: profile.emails[0].value,
          anhdaidien: profile.photos[0].value,
          vaitro: "user", // Gán mặc định user cho tài khoản đăng nhập bằng Google
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;