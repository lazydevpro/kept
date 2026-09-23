import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal'

export const metadata: Metadata = {
  title: 'Privacy — KEPT',
  description: 'What KEPT stores, who can see it, who it is shared with, and how to delete it.',
  alternates: { canonical: '/privacy' },
}

/*
 * Written from the schema, not from a template: every item below corresponds to a table or a
 * third-party call in `backend/`. If the backend starts storing something new, this page is
 * wrong until it says so.
 */
export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="23 September 2026">
      <p className="summary">
        KEPT is built so that your circle sees whether you kept your promise — never how much you invested or
        what you hold. There is no email, phone number or real name required, KEPT never holds your money or
        your keys, and you can delete everything from the app at any time.
      </p>

      <h2>Who we are</h2>
      <p>
        KEPT is an app for Solana Mobile that helps people build a weekly investing habit with a small circle of
        friends. In this policy, “KEPT”, “we” and “us” mean the people who operate the app and this site. You
        can reach us through the contact button on this site.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>An account.</strong> Created automatically and anonymously when you first open the app: a
          random identifier, a display name (you choose it, or it defaults to “Member” and four characters),
          your privacy setting and your timezone. We do not ask for your email, phone number or legal name.
        </li>
        <li>
          <strong>Your session.</strong> A sign-in token kept in your phone’s secure storage, and on our side
          the IP address and device description it was created from, so a session can be recognised and revoked.
        </li>
        <li>
          <strong>Wallet addresses you link.</strong> A public Solana address, recorded after you sign a message
          proving it is yours. Linking lets you buy and sell through KEPT and sign back in on another device.
        </li>
        <li>
          <strong>Your goal and weekly promises.</strong> The goal you set, each week’s promise, and whether and
          when it was kept.
        </li>
        <li>
          <strong>Purchases and sales made through KEPT.</strong> For each one: the transaction signature, the
          asset, the amount of USDC and of the asset, and whether it was verified on-chain. These are already
          public on the Solana blockchain; we keep them to show your portfolio and to know when a promise is
          kept.
        </li>
        <li>
          <strong>Your circles.</strong> Membership, the posts in each circle’s feed (such as “kept this week’s
          promise”), reactions, and nudges sent and received.
        </li>
        <li>
          <strong>Notifications.</strong> If you turn them on, your device’s push token.
        </li>
        <li>
          <strong>Your agreement to the terms.</strong> Which version you accepted and when.
        </li>
        <li>
          <strong>Messages you send us</strong> through this site’s contact form: your name, email, message and
          the country your request came from.
        </li>
      </ul>

      <h2>Who can see it</h2>
      <p>
        By default your circle sees your display name and whether you kept each week — as a ring, not an amount.
        You can choose to show amounts or holdings in settings; nothing more is shared unless you change it.
        Your portfolio, amounts and wallet address are visible only to you. A share card for a kept promise
        shows your display name and never an amount.
      </p>

      <h2>Who we share it with</h2>
      <p>We do not sell your data or use it for advertising. To run the app we rely on:</p>
      <ul>
        <li>
          <strong>Cloudflare</strong>, which hosts the app’s servers, database and this site.
        </li>
        <li>
          <strong>Jupiter</strong>, which prices and routes your trades. It receives the asset, the amount and
          your wallet address when you place an order.
        </li>
        <li>
          <strong>A Solana RPC provider</strong>, which we ask to read the public transactions you make through
          KEPT.
        </li>
        <li>
          <strong>Expo</strong>, which delivers push notifications if you enable them.
        </li>
        <li>
          <strong>Discord</strong>, where messages from this site’s contact form are delivered to us.
        </li>
      </ul>
      <p>We will disclose information if the law requires it.</p>

      <h2>On-chain activity</h2>
      <p>
        Transactions on Solana are public and permanent. Anyone can see what a wallet address holds and trades;
        KEPT cannot change that, and deleting your KEPT account does not remove anything from the blockchain.
      </p>

      <h2>How long we keep it</h2>
      <p>
        For as long as your account exists. Sessions expire after a year without use. Contact-form messages are
        kept for as long as needed to reply.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Change what your circle sees in the app’s settings.</li>
        <li>Leave any circle, or unlink a wallet, from Account in the app.</li>
        <li>
          Delete your account from Account in the app. This removes your profile, goal, promises, circle
          memberships, posts, reactions, nudges and records of your purchases. Circles you own pass to their
          longest-standing member.
        </li>
        <li>For anything else — including a copy of your data — contact us through this site.</li>
      </ul>

      <h2>Children</h2>
      <p>KEPT is not for anyone under 18.</p>

      <h2>Changes</h2>
      <p>If this policy changes, the date at the top will change with it.</p>
    </LegalPage>
  )
}
