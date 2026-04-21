// import { date, z } from 'zod';

// // Define the schema
// const UserSchema = z.object({
//   first_name: z.string(), // name should be a string
//   last_name: z.string(),
//   date-of-birth: z.string(),
//   date-of-birth: z.date();
//   email: z.email(), //email should be email
// });

// // data to validate
// {app.post('/submit', (req, res) => {
//   req.body is the object Nunjucks sent over
//   const result = UserSchema.safeParse(req.body);

// const result = Player.safeParse(userData);
// if (!result.success) {
//   result.error;   // ZodError instance
// } else {
//   result.data;
// }
