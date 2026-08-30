# API reference

Base URL for local development: `http://127.0.0.1:3001`.

Protected routes expect:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

There are two account roles:

- `reader` — the only role available through public registration;
- `librarian` — assigned out of band by an administrator and used for catalogue
  and lending operations.

## Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a reader account |
| `POST` | `/api/auth/login` | Public | Exchange credentials for a token |
| `GET` | `/api/auth/profile` | User | Full profile and activity |
| `GET` | `/api/auth/my-books-history` | User | Lending history |

Registration body:

```json
{
  "firstName": "Aida",
  "lastName": "Sarsen",
  "phoneNumber": "+77000000000",
  "email": "aida@example.com",
  "password": "long-password"
}
```

The server ignores a supplied `role` field and always creates a `reader`.

## Catalogue and lending

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/books` | Public | List books |
| `GET` | `/api/books/:bookId` | User | Book details and reviews |
| `GET` | `/api/books/author/:author` | Public | Filter by author |
| `GET` | `/api/books/keyword/:keyword` | Public | Filter by keyword |
| `POST` | `/api/books` | Librarian | Add a book |
| `POST` | `/api/books/multiple` | Librarian | Bulk import books |
| `POST` | `/api/issue` | Librarian | Issue a book to a reader |
| `GET` | `/api/my-books` | User | Current user's loans |
| `POST` | `/api/renew-book` | User | Renew own active loan by 1–30 days |
| `POST` | `/api/return-book` | User | Return own active loan |
| `POST` | `/api/block-renewal` | Librarian | Temporarily stop renewal |
| `GET` | `/api/statistics` | Librarian | Active, overdue and returned counts |
| `GET` | `/api/users` | Librarian | Reader directory |
| `GET` | `/api/users/:userId/books` | Librarian | A reader's lending history |

Example issue request:

```json
{
  "userId": 12,
  "bookId": 4,
  "dueDate": "2026-09-30T18:00:00.000Z"
}
```

## Community

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/create-club` | User | Create a club |
| `POST` | `/api/join-club` | User | Join a club |
| `GET` | `/api/top-clubs` | Public | Club leaderboard |
| `GET` | `/api/club/:clubId/profile` | Member | Club feed and activity |
| `POST` | `/api/club/:clubId/news` | Club admin | Publish club news |
| `POST` | `/api/create-club-event/:clubId` | Club admin | Create a club event |
| `POST` | `/api/duels` | Member | Start a reading duel |
| `POST` | `/api/duels/accept/:duelId` | Member | Accept a duel |
| `POST` | `/api/reviews` | User | Add a book review |
| `GET` | `/api/reviews/:bookId` | Public | List reviews |

## Events and quizzes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/events` | User | List and filter events |
| `POST` | `/api/events` | Librarian | Create an event |
| `POST` | `/api/register-event` | User | Register for an event |
| `GET` | `/api/que/:bookId` | User | Generate quiz questions |
| `POST` | `/api/ask` | User | Evaluate quiz answers |

Quiz endpoints require `OPENAI_API_KEY`. Notifications and scheduled reminders
are opt-in through environment flags; both are disabled by default.

## Errors

Errors use an HTTP status appropriate to the failure and a small JSON body:

```json
{ "message": "Недостаточно прав для этой операции." }
```

Common statuses are `400` for invalid input, `401` for authentication failures,
`403` for insufficient permissions, `404` for missing resources and `409` for
conflicting state.
