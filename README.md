# PPZ Zimbabwe Storefront

build the main page for PPZ Zimbabwe Online Store. Use TypeScript, make the page modern and attractive. use colours the logo, red mainly. build the main page, which should have products and the cart, the goal for an online store is for people to buy as easy and quick as possible without much difficult, so design the cart and put it on main. design main only for now. put 3 products there, SURECEM 32,5N; SureBuild 42,5N; SURECAST 42,5R; leave placeholder for pictures, l will insert. build it let's see. lt's an online store, not an informative website, the goal is for customers to buy, make it beautiful and attractive. generate the code long code, make it attractive and beautiful

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f4a3b222-69a2-47cd-9915-b3f25107cd84).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Demonstration account sign-in

This storefront provides public, password-free demo access. On the login page, choose **Proceed in demo mode** for the customer portal or **Proceed to Sales Department** for the staff portal. The selected portal is stored in this browser so it remains selected after a refresh. This is a public demonstration selector, not secure authentication; do not use it to protect real customer or staff data.

The staff workspace, quotation decisions, order updates, price changes, and related demo data are stored in this browser. SAP, ZIMRA, banking, email, and transport tracking are not connected to external services.

Order Review continues to `/payment` with the reviewed quotation held in browser session storage. PayNow initiation is disabled until a server-side merchant integration is configured; the frontend does not simulate successful payments or generate unverified receipts.
