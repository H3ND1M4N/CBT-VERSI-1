# Security Specification — CBT SDN GUNUNGSARI 04

## 1. Data Invariants
1. **Authentication & Verified Identity**: All Firestore reads and writes require a signed-in Google account with `request.auth.token.email_verified == true`.
2. **Admin Bootstrap**: `hendy.HF@gmail.com` (verified) and documents in `/admins/{uid}` hold full teacher/admin privileges across all school exam packages and student attempts.
3. **Exam Ownership & Visibility**:
   - Every `/exams/{examId}` must have `ownerId == request.auth.uid` on creation, valid bounded fields (`judul <= 200`, `soalList <= 100`), and server timestamps (`createdAt == request.time`, `updatedAt == request.time`).
   - Only `ownerId` or `isAdmin()` can update or delete an exam package.
   - Published exams (`isPublished == true`) can be read by verified signed-in students and teachers.
4. **Attempt Integrity & Relational Sync**:
   - Every `/attempts/{attemptId}` must reference an existing or atomically created exam via `existsAfter(/databases/$(database)/documents/exams/$(incoming().examId))` and match `examOwnerId` via `getAfter(...)`.
   - Students can only create attempts with `studentUid == request.auth.uid` and read their own attempts (`studentUid == request.auth.uid`).
   - Only the exam owner (`examOwnerId == request.auth.uid`) or `isAdmin()` can grade (update) or delete attempts.
   - Once an attempt reaches terminal status `'dinilai'`, non-admin updates are locked (`existing().status != 'dinilai' || isAdmin()`).
5. **Immutable Seed Marker**:
   - `/schoolMeta/seed` can only be created once (`allow update, delete: if false`) so deleted sample data never reverts to defaults.

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Unauthenticated Exam Read**: `get /exams/exam-ipas-sd4` with `request.auth == null`.
2. **Unverified Email Exam Create**: `create /exams/exam-1` with `email_verified: false`.
3. **Spoofed Exam Owner**: `create /exams/exam-2` with `ownerId: "someone-else"` != `request.auth.uid`.
4. **Shadow Field Injection on Exam**: `create /exams/exam-3` including extra field `isVerified: true`.
5. **Client Timestamp Forgery**: `create /exams/exam-4` with client-supplied `createdAt` != `request.time`.
6. **Oversized ID Poisoning**: `create /exams/${'a'.repeat(200)}` exceeding 128 chars or containing `/`.
7. **Unbounded Soal Array**: `create /exams/exam-5` with `soalList` having 101+ items.
8. **Student Tampering Own Attempt Score**: `update /attempts/att-1` by `studentUid` attempting to modify `nilaiAkhir: 100`.
9. **Orphan Attempt Creation**: `create /attempts/att-orphan` referencing non-existent `examId: "non-existent"`.
10. **Non-Owner Exam Deletion**: `delete /exams/exam-ipas-sd4` by a student or non-owner non-admin user.
11. **Terminal State Bypass**: `update /attempts/att-graded` where `existing().status == 'dinilai'` by a non-admin user.
12. **Blanket List Scraping Attempts**: `list /attempts` by a student expecting another student's attempt without `studentUid == request.auth.uid`.
