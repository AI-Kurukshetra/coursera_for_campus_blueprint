# structure.md

# Project Structure

/app

/api
/auth
/users
/courses
/programs
/lessons
/enrollments
/assessments
/grades
/payments
/discussions
/analytics
/notifications
/certificates
/support
/calendar

/(auth)
login
signup
forgot-password

/(student)
dashboard
courses
progress
certificates
calendar

/(instructor)
dashboard
courses
lessons
quizzes
analytics

/(admin)
dashboard
universities
programs
reports

/components

course
lesson
video-player
quiz
discussion
certificate
analytics
calendar
support
ui

/lib

supabase
auth
middleware
analytics
utils

/services

courseService.ts
enrollmentService.ts
quizService.ts
paymentService.ts
certificateService.ts
analyticsService.ts

/database

schema.sql
migrations

/types

user.ts
university.ts
program.ts
course.ts
lesson.ts
quiz.ts
grade.ts
certificate.ts

/public

certificates
assets

/styles

---

# Supabase Storage

Buckets:

videos
course-materials
assignments
certificates
avatars

---

# Roles

Student
Instructor
Admin
University Manager

---

# Environment Variables

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

---

# API Groups

/api/auth
/api/users
/api/courses
/api/enrollments
/api/assessments
/api/grades
/api/payments
/api/discussions
/api/analytics
/api/certificates
/api/notifications
/api/support
/api/calendar
