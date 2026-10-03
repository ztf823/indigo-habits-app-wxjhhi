# Indigo Habits iOS Build and TestFlight Flow

Use this as the release procedure for Indigo Habits. This is the established EAS workflow; do not create a separate workflow for each build.

## Release steps

1. Finish and verify the intended source changes.
2. Increment `expo.ios.buildNumber` in `app.json` for every new iOS binary. Increment the marketing version only when appropriate.
3. Commit and push the exact release source to the GitHub branch used for the release.
4. For a normal new release, leave `existing_build_id` empty. In the signed-in Expo dashboard, open Indigo Habits → Workflows and run the existing **Build iOS production and submit to TestFlight** workflow against that exact commit.
5. Let the workflow build with the production profile, then submit that same build to App Store Connect using the existing submission credentials and app ID `6759208557`.
6. Verify both workflow jobs succeeded, then check App Store Connect → TestFlight until Apple finishes processing the build. Install that build in TestFlight for the final device check.

## Release safeguards

- The bundle identifier is `com.indigohabits.journal2026`; preserve it.
- Do not start a second build if the build already succeeded and only submission failed. Inspect the failure first. Re-run this same workflow with `existing_build_id` set to the successful EAS build UUID; the build job skips and the existing TestFlight job submits that binary.
- Keep the workflow runner on Node 22.23.1 as well as the production build profile. The upload job also installs dependencies and cannot use Node 20 with the current lockfile.
- Do not add a pinned `submit-build-NN` workflow for an individual release. Keep the existing combined workflow as the single build-and-submit path.
- Do not switch to terminal login or Transporter; use the signed-in Expo dashboard workflow.
- Do not submit for Beta App Review or App Store review unless specifically requested.
- Never put Apple credentials, API keys, or other secrets in the repository.

## Current app identifiers

- App Store Connect app: Indigo Habits
- App Store Connect app ID: `6759208557`
- Bundle ID: `com.indigohabits.journal2026`
- EAS project ID: `c9f381e8-423f-4420-b5c5-d3e6b08dd99d`
