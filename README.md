# n8n-nodes-churchhq

Official [n8n](https://n8n.io) nodes for **Church HQ**, the church management platform by Level Up.

- **Church HQ Trigger** starts a workflow when something happens in Church HQ (a person is added, a
  form is submitted, a gift is received, a background check result is recorded, and more). It
  registers its own signed webhook with Church HQ when the workflow is activated, verifies every
  request's signature and timestamp, and removes the registration when the workflow is deactivated.
- **Church HQ** reads and updates Church HQ: people, households, tags, tasks, events and attendance,
  forms and submissions, Smart Lists, messages, gifts, background checks, starting Church HQ
  workflows, and the sync pattern (external links and sync jobs).

The Church HQ API is part of Church HQ's Enterprise plan.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in
the n8n community nodes documentation and install `n8n-nodes-churchhq`.

## Credentials

1. In Church HQ, an Owner or Administrator opens **Administration > Integrations > Connect n8n** and
   clicks **Create n8n connection key**. The key is shown once; copy it.
2. In n8n, create a **Church HQ API** credential, paste the key into **API Key**. **API URL** is filled
   in already (it is shown on the Connect n8n screen if it ever needs checking).
3. Save. n8n tests the credential by calling Church HQ's `GET /me`.

A key acts as the Owner or Administrator who created it, limited to the key's own permissions. The
Connect n8n key can work with people, events and attendance, forms, messages, workflows and sync
links. It cannot see giving, child safety, prayer or background-check data; for a flow that needs
those, create a general API key with that permission under **Administration > Integrations > API
keys** and use it in a separate credential.

## Church HQ Trigger

Choose one or more **Events**. When the workflow is activated, the node registers this workflow's
webhook URL with Church HQ and stores the signing secret Church HQ returns (once). Every delivery is
checked:

- the `ChurchHQ-Signature` header must be a valid HMAC-SHA256 of the timestamp and raw body with that
  secret, compared in constant time;
- the timestamp must be within 5 minutes, so a captured request cannot be replayed later.

Anything else gets `401` and never starts the workflow. **Include Test Events** controls whether
Church HQ's **Send test** starts the workflow.

Each item contains the event envelope:

```json
{
  "id": "delivery id",
  "type": "person_created",
  "event_id": "event id",
  "occurred_at": "2026-09-20T15:04:05Z",
  "organization_id": "…",
  "api_version": "2026-09-20",
  "test": false,
  "replay_of": null,
  "data": { "person_id": "…", "membership_status": "visitor" }
}
```

`data` carries record ids and non-identifying details only. Use a **Church HQ** node (for example
Person > Get) to fetch more. Deduplicate on `event_id` if a replayed delivery would matter.

## Church HQ (actions)

| Resource | Operations |
|---|---|
| Person | Create, Get, Get Many, Update, Add Tag, Remove Tag, Get Tags |
| Household | Create, Get (with members), Get Many, Update |
| Task | Create, Complete, Get Many |
| Event | Get, Get Many |
| Attendance | Record, Get Many |
| Form | Get Many, Get Submissions |
| Smart List | Get Many, Get Members |
| Message | Send (email or SMS, through Church HQ Messaging, respecting opt-outs) |
| Donation | Get Many (needs a key with the Giving permission) |
| Background Check | Record, Get for Person (needs the Background checks permission) |
| Inbound Event | Send (runs Church HQ workflows that use the "Outside system sends an event" trigger) |
| External Link | Create or Update, Find, Delete |
| Sync Job | Start, Record Events, Finish |

Person > Create runs Church HQ's duplicate check first: a strong match (same name and the same email,
phone or birthday) stops with an error unless **If a Duplicate Is Found** is **Create Anyway**.

Errors show Church HQ's own explanation, for example *This key needs the "giving:read" permission for
this endpoint.*

## Example workflows

- **Newcomer to email platform:** Church HQ Trigger (Person is added) > Church HQ (Person > Get) >
  your email platform's node (add subscriber) > Church HQ (External Link > Create or Update).
- **Nightly accounting export:** Schedule Trigger > Church HQ (Donation > Get Many, Return All, Given
  Since = yesterday) with a Giving key > your accounting system's node.
- **Background check provider results:** Webhook (from the provider) > Church HQ (Person > Get Many,
  Search) > Church HQ (Background Check > Record).
- **Start a Church HQ workflow from elsewhere:** any trigger > Church HQ (Inbound Event > Send, event
  name `n8n.new_signup`); in Church HQ, a workflow using "Outside system sends an event" with that
  name runs.

## Rate limits

120 requests per minute per key and 600 per minute per church. Over the limit, Church HQ answers `429`
with `Retry-After`; use n8n's **Retry On Fail** with a wait for high-volume flows.

## Compatibility

Built with `@n8n/node-cli` 0.48 and tested with n8n 2.39.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- The Church HQ API reference is available from Level Up.

## License

[MIT](LICENSE.md)
