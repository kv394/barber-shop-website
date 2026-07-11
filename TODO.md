# To-Do List

- [ ] Convert animated `.webp` training videos to `.mp4` format to enable seeking/scrubbing in the `CaptionedVideoPlayer` component. (Requires external conversion tool since local ffmpeg does not support WebP ANIM chunks).

## Dance Studio Feature Set
- [x] Client Portal: Family / Dependents Management
- [x] Client Portal: Class Scheduling and Enrollment
- [ ] Stripe Integration: Enforce tuition/drop-in payments at the time of Class Enrollment

## Core Infrastructure
- [ ] Migrate scheduling database triggers to pg_cron
- [ ] Setup Redis for real-time notifications
