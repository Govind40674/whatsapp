import * as yup from "yup";

const EditProfileSchema = yup.object().shape({
  name: yup
    .string()
    .min(3, "Name must be at least 3 characters")
    .required("Name is required"),

  // ✅ FIXED IMAGE VALIDATION
  image: yup
    .mixed()
    .test("fileSize", "File is too large", (value) => {
      if (!value || !value.length) return true; // optional
      return value[0].size <= 2 * 1024 * 1024; // 2MB
    })
    .test("fileType", "Unsupported file format", (value) => {
      if (!value || !value.length) return true;
      return ["image/jpeg", "image/png", "image/jpg"].includes(
        value[0].type
      );
    }),

password: yup
  .string()
  .transform((value) => (value === "" ? undefined : value))
  .min(6, "Password must be at least 6 characters")
  .notRequired(),
  
    

  confirmPassword: yup.string().when("password", {
    is: (val) => val && val.length > 0,
    then: (schema) =>
      schema
        .required("Confirm Password is required")
        .oneOf([yup.ref("password")], "Passwords must match"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export default EditProfileSchema;