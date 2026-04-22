import * as yup from "yup";

const SignupSchema = (otpSent) =>
  yup.object().shape({
    email: yup
      .string()
      .email("Invalid email")
      .required("Email is required"),

    otp: otpSent
      ? yup
          .string()
          .matches(/^\d+$/, "OTP must be numeric")
          .length(6, "OTP must be 6 digits")
          .required("OTP is required")
      : yup.string(),

    password: otpSent
      ? yup
          .string()
          .min(6, "Password must be at least 6 characters")
          .required("Password is required")
      : yup.string(),
  });

export default SignupSchema;