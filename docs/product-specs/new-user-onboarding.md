# New User Onboarding

## Problem

New users need to understand three things quickly:

1. what `alem` is for
2. how to connect a provider securely
3. how to get value from the first chat with attachments

Without guided onboarding, users can drop off before experiencing the product's core value (vendor freedom + practical AI workflows).

## Goals

- reduce time-to-first-successful-response
- increase provider setup completion rate
- increase first-session attachment usage for relevant tasks

## Non-Goals

- full tutorial of every screen
- forced single provider setup
- collecting unnecessary personal data

## User Journey (MVP)

1. Launch app and see value proposition in plain language
2. Open provider settings and add at least one API key
3. Select default provider/model
4. Start first chat (optional file/image attach)
5. Receive first useful response and understand next actions

## Functional Requirements

- first-run helper panel with setup checklist
- quick jump from onboarding to provider settings
- validation and friendly error handling for missing/invalid key
- one-click "start first chat" action once setup is complete

## MVP Status

- implemented: first-run carousel with three slides in a split layout (illustration + content)
  - slide 1: value proposition with icon-accented feature highlights
  - slide 2: Agent mode overview reframed as empowerment, with data-local trust signals
  - slide 3: provider setup with concrete provider cards (OpenAI, Anthropic, Google)
- implemented: placeholder illustrations per slide (replace with branded art)
- implemented: final onboarding action opens Settings to AI Providers
- implemented: onboarding is shown once and then skipped on subsequent launches
- implemented: pill-shaped active dot indicators with step counter ("Step X of 3")
- implemented: back navigation on slides 2 and 3
- implemented: entrance animation on slide content transitions

## UX / Trust Requirements

- clearly explain key ownership and local storage behavior
- never display full API key in clear text after save
- explain provider/model choice without ranking bias

## Success Metrics

- onboarding completion rate
- median time to first successful model response
- day-1 return rate
- first-session "message + attachment" completion rate

## Risks

- too much guidance can feel heavy
- too little guidance can fail to activate new users
- provider API errors can be mistaken for app failure
