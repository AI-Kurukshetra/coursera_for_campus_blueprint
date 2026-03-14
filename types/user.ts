export type UserRole = 'student' | 'instructor' | 'admin' | 'university_manager';
export type SignupRole = Extract<UserRole, 'student' | 'instructor'>;
