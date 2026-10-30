# Routes and pages

TanStack Start uses **file-based routing**. Every route file in this directory
defines a URL and imports its screen from the matching folder under `src/pages/`.
Keep route metadata and `createFileRoute` declarations in `src/routes/`; keep
page UI and page-only components in `src/pages/<page>/`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dynamic — bare `$`, no curly braces) |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment) |
| `files/$.tsx` | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx` | layout route (renders children via `<Outlet />`) |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.

## Adding a page

Add a folder such as `src/pages/account/` for the page component and its
page-specific components. Add the matching TanStack route file under
`src/routes/` (for example, `src/routes/account.tsx`) and import the page
component there. Keep reusable components and state in `src/features/`.
