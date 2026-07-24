# Team Hub Portal

A small internal portal built with Next.js. An administrator can sign in,
publish announcements, and view the latest announcements in a shared feed.

## Setup and run

Requirements:

- Node.js 20.19 or newer
- A MongoDB database

Install the dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

For PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set the following values in `.env.local`:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-secret-containing-at-least-32-characters
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in using
`ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## API documentation

The Postman collection and request examples are available in the
[Team Hub Portal API documentation](https://documenter.getpostman.com/view/19114754/2sBY4Qszs1).

## Key decisions

- I chose an announcements feed as the single content section so the
  create-and-view workflow could be completed cleanly end to end.
- Next.js App Router provides both the frontend pages and backend route
  handlers in one application.
- MongoDB and Mongoose provide persistent storage, with connection caching to
  avoid duplicate connections during development reloads.
- The first valid administrator login creates the configured admin account and
  stores the password as a bcrypt hash.
- JWT sessions are stored in HTTP-only, same-site cookies. Both the protected
  page and announcement API routes verify the session.
- Local React state is sufficient for the single interactive announcements
  section, so no global state library was added.
- The feed returns the newest 50 announcements. Editing, hiding, restoring, and
  deleting were added beyond the requested create-and-view scope.
