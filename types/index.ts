export type UserRole = "admin" | "librarian" | "member";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
