import * as yup from "yup";

const EmailSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email")
    .required("Email is required"),
});

export default EmailSchema;