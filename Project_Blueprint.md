EventMind AI — Project Blueprint
Project: EventMind AI: Autonomous Enterprise Event Planning & Real-Time Orchestration Engine
Build window: 5 days
Final deliverable: A professional, publicly deployed website that your teacher can open and test without an account.

1. Product direction
EventMind AI is a control room for corporate events. It helps organizers compare vendor quotes, build a conflict-free agenda, respond to live disruptions, and measure event performance from one website.

The project brief describes a full enterprise platform. In five days, we’ll build a working MVP that covers all five objectives at demo scale, rather than a set of disconnected screens that imply functionality we haven’t built. The flagship feature gets the most build time.

What makes it unique: the Event Digital Twin
Your teacher won’t just look at a dashboard. They’ll trigger a disruption in a simulated conference and watch the system recover.

Open the organizer dashboard for a seeded, two-track tech summit.
Trigger an overcapacity incident: projected attendance jumps to 110 for a session in an 80-seat room.
EventMind checks the agenda and finds an available 150-seat room with the required AV and accessibility features.
The organizer sees a before/after proposal, why it works, and what attendees will be told.
The organizer clicks Approve & Publish.
The attendee agenda updates in a second tab, and the activity log records the incident, the decision, and the publication.
The product rule: EventMind can monitor, evaluate, and recommend automatically. It cannot publish a schedule change, redirect attendees, or commit vendor spending without organizer approval. If no valid option exists, it says so and leaves the agenda unchanged.

2. Functionality we’re committing to
Project objective	What we’ll build in five days	What we won’t claim or build
Vendor sourcing and procurement	Generate an editable RFP draft from event requirements. Compare three seeded quotes on cost, requirements, and budget fit. Show the effect of shortlisting a quote on projected spend.	Actual vendor outreach, autonomous negotiation, contract signing, or payments.
Dynamic multi-track scheduling	Generate a starter agenda from seed data. Check room and speaker overlaps, speaker availability, capacity, and AV requirements. Show unscheduled sessions with a reason rather than silently dropping them.	Full-scale optimization across large venues or external calendar integrations.
Live event orchestration	Simulate overcapacity and speaker delay. Detect the issue, check available alternatives, show a proposal, publish on approval, and update the attendee view.	Physical sensors, radio integrations, emergency-response automation, or native push notifications.
Attendee matchmaking	Use seeded attendee interests to recommend three relevant sessions or sponsors. Display a reason for each match, such as “Matches your interest in cloud security.”	Real attendee profiling, embedding infrastructure, or a networking chat system.
Event ROI and attribution	Show actual vs. planned spend, session check-ins, and qualified sponsor leads from seeded data. Update a metric when a simulated check-in is recorded.	Verified revenue attribution or claims of achieved savings, lead lift, or guaranteed zero delays.
How we’ll handle the business-impact figures in the brief: The 70% overhead reduction, 25% budget optimization, 3× sponsor-match lift, and zero cascading delays are project targets, not measured outcomes. If we show a financial return, it will be labeled Illustrative ROI, with its seeded inputs and formula visible. Sponsor pipeline value, if shown, is separate from realized revenue.

3. Website structure and user flow
Page	What the user can do
Landing /	Understand the product in one sentence. Click Launch Live Demo to start a preloaded event.
Overview /demo	See event status, budget, the next session, and active incidents. Follow a short demo checklist.
Planning /demo/planning	Draft an RFP, compare quotes, and shortlist a vendor.
Agenda /demo/agenda	Generate or view the agenda by track, with conflict and unscheduled-session warnings.
Live Control /demo/live	Run a simulation, inspect the proposed change, approve or dismiss it, and view the activity log.
Attendee View /demo/attendee	See the published agenda, recent notices, and recommended sessions or sponsors. Open this in a second tab for the demo.
Analytics /demo/analytics	Review budget, check-ins, sponsor leads, and the definitions behind the numbers.
Organizer flow: Launch demo → plan budget and shortlist vendors → generate agenda → simulate a live incident → approve a recovery plan → review results.

Attendee flow: Open attendee view → check the agenda → see the published update → browse recommendations.

Demo access: Your teacher won’t need an account. Each browser gets its own demo workspace, and the organizer and attendee tabs share that workspace. The attendee view has no organizer controls; it’s a demo view, not a production permissions system. Reset Demo restores the original scenario without affecting another visitor.

4. Agentic design: how the system makes decisions
We’ll build the agents as small modules inside one application, not separate services. Each module has a defined job and returns a result that the application can validate.

Module	Responsibility
Procurement Agent	Takes event requirements and vendor quotes, drafts the RFP, and explains the quote comparison. Budget totals are calculated in code.
Scheduling Agent	Places sessions in valid time slots and rooms using explicit rules. Returns the agenda and any sessions it couldn’t place.
Live Operations Agent	Turns a simulated incident into a validated recovery proposal, or reports that no safe change is available.
Matchmaking and Analytics Modules	Use explicit scoring rules and formulas so recommendations and metrics can be explained and tested.
Decision flow for a live incident
Detect → evaluate options → validate constraints → explain the proposed change → request approval → publish → log.

Overcapacity: Try a suitable available room at the same time first. If there isn’t one, escalate for manual review.
Speaker delay: Try a later slot for the affected session without moving unrelated sessions. If no valid slot exists, escalate.
Hard constraints: Never suggest a room with insufficient capacity or the wrong AV or accessibility features. Never double-book a room or speaker, place a speaker outside their availability, or move a locked session.
Before publishing: Recheck the proposal against the current agenda. If the agenda has changed since the proposal was generated, reject the stale proposal and ask the organizer to regenerate it.
After publishing: Save the new agenda, attendee notice, and log entry together so the views don’t disagree.
A hosted language model can draft the RFP and explain already validated proposals. It does not decide whether a schedule is valid or write directly to the database. If the API key is missing or the model call fails, template-based text keeps the full demo usable. The interface will distinguish AI-generated from rules-based output. If we use OpenAI for the hosted model, Structured Outputs can constrain the response to a defined schema. Source

5. Technical blueprint
Layer	Decision
Frontend	Next.js App Router, TypeScript, Tailwind CSS, and a small set of reusable UI components.
Backend	Next.js server route handlers for demo actions, validation, persistence, and optional AI requests. Keep everything in one repository. Source
Database	Supabase Postgres. For the MVP, store one versioned state record per demo workspace. It contains the seed agenda, rooms, speakers, quotes, incidents, proposals, notices, and metrics. One version-checked write publishes an approved change.
Attendee updates	Poll a lightweight attendee endpoint every 3 seconds while the page is visible, and refresh on tab focus. This gives us a near-real-time demo without building a separate streaming service.
Demo isolation	Use a random workspace token in an HttpOnly cookie. Resolve the workspace on the server, validate all actions there, and use synthetic data only. Keep the Supabase secret server-side; it bypasses row-level security. Source
Hosting	GitHub → Vercel for the website; Supabase for persistent storage. Deploy on Day 1, not at the end. Vercel supports preview and production deployments from Git. Source
Professional design direction
Use navy, slate, and off-white for an enterprise control-room look. Reserve amber for warnings, red for active incidents, and green for resolved states. Build the organizer view around a consistent sidebar and page header; give the attendee view a simpler, mobile-first layout.

The signature screen is Live Control: incident on the left, before/after proposal on the right, and a timestamped activity log below. Prioritize readable tables, clear button labels, visible keyboard focus, and good loading, empty, and error states before adding animations.

6. Five-day execution plan
Day	Build	Done when
1 — Foundation and deployment	Save this blueprint. Create the repo, app shell, landing page, Supabase workspace storage, seeded event, and reset action. Connect GitHub to Vercel.	The public URL opens in incognito, launches the seeded demo, and retains state after refresh.
2 — Planning and scheduling	Build the vendor comparison, RFP draft, budget summary, agenda generator, and constraint checks. Add tests for room overlap, speaker overlap, and insufficient capacity.	The demo can shortlist a quote and generate an agenda that explains any unscheduled session.
3 — Flagship live workflow	Build the incident simulator, recommendation panel, approval, activity log, and attendee update. Complete overcapacity end to end before starting speaker delay.	Two tabs on the deployed site demonstrate incident → proposal → approval → updated attendee agenda.
4 — Round out the product	Add matchmaking, analytics, and the guided demo checklist. Finish speaker delay if it’s not already done. Wire the hosted AI provider only after the rules-based flow is stable. Polish mobile layouts and loading/error states.	All five objectives are represented in a working demo, and the demo still works without a model key.
5 — Freeze, test, and present	Stop adding features. Test production from a fresh browser, fix bugs, verify reset and workspace isolation, finish the README, and record a backup walkthrough.	The public link, repo, and presentation are ready to share.
If we fall behind: Cut animations, custom charts, and hosted AI integration first. If we still need time, ship just the overcapacity scenario and explicitly mark speaker delay as planned. Do not cut the approval flow, attendee update, reset button, or public deployment. Those are what make it a convincing working product.

7. Definition of done
 The public link opens without login or setup in a fresh browser.
 Vendor comparison, agenda generation, attendee recommendations, and analytics work with seeded data.
 The overcapacity scenario proposes the correct 150-seat room without introducing a conflict.
 A proposal does not alter the attendee agenda until approved.
 After approval, the new room and notice appear in the attendee tab within five seconds under normal demo conditions.
 When no valid room exists, the system escalates and leaves the agenda unchanged.
 A stale or duplicate approval cannot publish the same change twice.
 Reset restores the seed event, and a separate browser session is unaffected.
 The experience works without a model API key, and mobile pages are usable.
 The README includes the live URL, setup instructions, architecture, and demo limitations.
Teacher walkthrough: three minutes
Show the plan: Open the event overview and point out the two-track agenda and vendor budget.
Break the plan: Trigger the overcapacity incident. Open the attendee view in a second tab and show that nothing has changed yet.
Show the recovery: Explain why the proposed room works, approve it, then switch tabs to show the published update.
Close with the evidence: Show the activity log and analytics. Explain which data is simulated and what would require real integrations.
The line to end on: “EventMind doesn’t just flag that a room is too small. It checks the alternatives, shows the organizer why the recommendation works, and updates the attendee agenda once the change is approved.”