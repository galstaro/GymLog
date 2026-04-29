// Static swap database keyed by exercise name.
// Each swap entry: { name, reason, ratio, tags[] }
// ratio: multiply user's last weight by this to get suggested weight
// tags: one or more of machine_taken | no_equipment | variety | hurts_shoulder | hurts_elbow | hurts_wrist | hurts_lower_back

const SWAPS = {
  'Bench Press': [
    { name: 'Dumbbell Fly', reason: 'Isolates chest with less joint stress', ratio: 0.4, tags: ['machine_taken', 'variety', 'hurts_shoulder'] },
    { name: 'Chest Dip', reason: 'Bodyweight push, same chest angle', ratio: null, tags: ['machine_taken', 'no_equipment', 'variety'] },
    { name: 'Incline Dumbbell Press', reason: 'Upper chest emphasis, free-weight alternative', ratio: 0.55, tags: ['machine_taken', 'variety'] },
    { name: 'Push-up', reason: 'No equipment needed, same movement pattern', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Incline Bench Press': [
    { name: 'Incline Dumbbell Press', reason: 'Same angle, easier on the wrists', ratio: 0.5, tags: ['machine_taken', 'variety', 'hurts_wrist'] },
    { name: 'Dumbbell Fly', reason: 'Pure pec stretch without tricep involvement', ratio: 0.35, tags: ['variety', 'hurts_elbow'] },
    { name: 'Chest Dip', reason: 'Forward lean hits upper chest', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Dumbbell Fly': [
    { name: 'Cable Fly', reason: 'Constant tension through full range', ratio: 0.6, tags: ['variety', 'machine_taken'] },
    { name: 'Bench Press', reason: 'Adds tricep drive for more load', ratio: 2.2, tags: ['variety'] },
    { name: 'Chest Dip', reason: 'Bodyweight chest isolation', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Chest Dip': [
    { name: 'Bench Press', reason: 'Horizontal push, easier on shoulders', ratio: 0.8, tags: ['hurts_shoulder', 'variety'] },
    { name: 'Dumbbell Fly', reason: 'Less shoulder involvement', ratio: 0.4, tags: ['hurts_shoulder', 'machine_taken'] },
    { name: 'Push-up', reason: 'Similar push pattern, no equipment', ratio: null, tags: ['no_equipment'] },
  ],
  'Incline Dumbbell Press': [
    { name: 'Incline Bench Press', reason: 'Barbell allows more total load', ratio: 1.8, tags: ['variety', 'machine_taken'] },
    { name: 'Dumbbell Fly', reason: 'Pure chest isolation at incline angle', ratio: 0.6, tags: ['variety', 'hurts_elbow'] },
    { name: 'Chest Dip', reason: 'Bodyweight upper chest hit', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],

  'Squat': [
    { name: 'Leg Press', reason: 'Same quad drive, less spinal load', ratio: 2.5, tags: ['machine_taken', 'hurts_lower_back'] },
    { name: 'Romanian Deadlift', reason: 'Posterior chain if quads are fatigued', ratio: 0.9, tags: ['variety'] },
    { name: 'Leg Extension', reason: 'Isolates quads with zero spinal load', ratio: 0.3, tags: ['hurts_lower_back', 'hurts_shoulder'] },
    { name: 'Hip Thrust', reason: 'Glute-dominant, no spinal compression', ratio: 1.0, tags: ['hurts_lower_back'] },
  ],
  'Leg Press': [
    { name: 'Squat', reason: 'Greater muscle activation and core work', ratio: 0.4, tags: ['variety'] },
    { name: 'Leg Extension', reason: 'Isolated quad work, seated and safe', ratio: 0.2, tags: ['machine_taken', 'hurts_lower_back'] },
    { name: 'Bulgarian Split Squat', reason: 'Unilateral strength with no machine needed', ratio: 0.3, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Romanian Deadlift': [
    { name: 'Leg Curl', reason: 'Isolates hamstrings with no lower back stress', ratio: 0.35, tags: ['hurts_lower_back', 'machine_taken'] },
    { name: 'Hip Thrust', reason: 'Glute/hamstring power without spinal loading', ratio: 0.9, tags: ['hurts_lower_back', 'variety'] },
    { name: 'Good Morning', reason: 'Similar hip hinge pattern', ratio: 0.5, tags: ['variety', 'no_equipment'] },
  ],
  'Leg Curl': [
    { name: 'Romanian Deadlift', reason: 'Stronger hamstring stretch through hip hinge', ratio: 2.5, tags: ['variety', 'machine_taken'] },
    { name: 'Hip Thrust', reason: 'Glute and hamstring compound alternative', ratio: 2.0, tags: ['machine_taken', 'variety'] },
    { name: 'Nordic Curl', reason: 'Bodyweight hamstring curl, very intense', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Leg Extension': [
    { name: 'Squat', reason: 'Compound quad movement for more volume', ratio: 2.5, tags: ['variety', 'machine_taken'] },
    { name: 'Leg Press', reason: 'Multi-joint, still seated and controlled', ratio: 4.0, tags: ['machine_taken'] },
    { name: 'Step-up', reason: 'Unilateral quad work, no machine needed', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Calf Raise': [
    { name: 'Seated Calf Raise', reason: 'Targets soleus more, less knee stress', ratio: 0.7, tags: ['machine_taken', 'variety'] },
    { name: 'Jump Rope', reason: 'Explosive calf activation', ratio: null, tags: ['no_equipment', 'variety'] },
  ],
  'Hip Thrust': [
    { name: 'Romanian Deadlift', reason: 'Hip hinge with hamstring emphasis', ratio: 1.0, tags: ['machine_taken', 'variety'] },
    { name: 'Glute Bridge', reason: 'Same movement, no bench needed', ratio: 0.9, tags: ['no_equipment'] },
    { name: 'Squat', reason: 'Compound lower body, glute-activating', ratio: 0.8, tags: ['machine_taken', 'variety'] },
  ],

  'Deadlift': [
    { name: 'Romanian Deadlift', reason: 'Hip hinge focus, lower back friendly', ratio: 0.75, tags: ['hurts_lower_back', 'variety'] },
    { name: 'Trap Bar Deadlift', reason: 'More upright torso, easier on lower back', ratio: 1.0, tags: ['hurts_lower_back', 'machine_taken'] },
    { name: 'Hip Thrust', reason: 'Posterior chain work without spinal compression', ratio: 0.9, tags: ['hurts_lower_back'] },
  ],
  'Pull-up': [
    { name: 'Lat Pulldown', reason: 'Same movement pattern, adjustable weight', ratio: 0.7, tags: ['machine_taken', 'variety', 'hurts_shoulder'] },
    { name: 'Seated Cable Row', reason: 'Horizontal pull variation, less shoulder strain', ratio: 0.6, tags: ['hurts_shoulder', 'variety'] },
    { name: 'Resistance Band Pull-up', reason: 'Assisted version with no machine', ratio: null, tags: ['no_equipment'] },
  ],
  'Lat Pulldown': [
    { name: 'Pull-up', reason: 'Bodyweight version, no machine needed', ratio: null, tags: ['no_equipment', 'machine_taken'] },
    { name: 'Seated Cable Row', reason: 'Horizontal pull, great width-to-thickness balance', ratio: 0.9, tags: ['variety', 'machine_taken'] },
    { name: 'Barbell Row', reason: 'Free-weight lat and thickness builder', ratio: 0.6, tags: ['variety', 'machine_taken'] },
  ],
  'Seated Cable Row': [
    { name: 'Barbell Row', reason: 'Free-weight pull with more core engagement', ratio: 0.8, tags: ['machine_taken', 'variety'] },
    { name: 'Dumbbell Row', reason: 'Unilateral, no cable machine needed', ratio: 0.45, tags: ['no_equipment', 'machine_taken'] },
    { name: 'Cable Row', reason: 'Different grip/angle on same cable stack', ratio: 1.0, tags: ['variety'] },
  ],
  'Cable Row': [
    { name: 'Seated Cable Row', reason: 'Same cable, different attachment and angle', ratio: 1.0, tags: ['variety'] },
    { name: 'Barbell Row', reason: 'Free-weight compound back builder', ratio: 0.8, tags: ['machine_taken', 'variety'] },
    { name: 'Dumbbell Row', reason: 'Unilateral, requires no cable machine', ratio: 0.45, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Barbell Row': [
    { name: 'Seated Cable Row', reason: 'Cable keeps tension constant, easier on lower back', ratio: 1.1, tags: ['hurts_lower_back', 'variety'] },
    { name: 'Dumbbell Row', reason: 'Unilateral, better range of motion', ratio: 0.45, tags: ['variety', 'hurts_lower_back'] },
    { name: 'Lat Pulldown', reason: 'Vertical pull to complement back thickness', ratio: 1.1, tags: ['machine_taken', 'variety'] },
  ],

  'Overhead Press': [
    { name: 'Dumbbell Shoulder Press', reason: 'Greater range of motion, easier on wrists', ratio: 0.45, tags: ['hurts_wrist', 'variety', 'machine_taken'] },
    { name: 'Lateral Raise', reason: 'Isolates medial delt, no overhead loading', ratio: 0.15, tags: ['hurts_shoulder', 'hurts_elbow'] },
    { name: 'Arnold Press', reason: 'Hits all three delt heads through rotation', ratio: 0.4, tags: ['variety'] },
    { name: 'Seated Dumbbell Press', reason: 'Seated version reduces lower back stress', ratio: 0.45, tags: ['hurts_lower_back'] },
  ],
  'Lateral Raise': [
    { name: 'Cable Lateral Raise', reason: 'Constant tension throughout the arc', ratio: 0.9, tags: ['machine_taken', 'variety'] },
    { name: 'Overhead Press', reason: 'Compound shoulder movement for more load', ratio: 5.0, tags: ['variety'] },
    { name: 'Face Pull', reason: 'Rear delt and rotator cuff balance work', ratio: 1.5, tags: ['variety', 'hurts_shoulder'] },
  ],
  'Face Pull': [
    { name: 'Lateral Raise', reason: 'Medial delt work if cables are taken', ratio: 0.7, tags: ['machine_taken', 'variety'] },
    { name: 'Band Pull-apart', reason: 'Rear delt work with no machine needed', ratio: null, tags: ['no_equipment', 'machine_taken'] },
    { name: 'Reverse Fly', reason: 'Rear delt isolation with dumbbells', ratio: 0.5, tags: ['machine_taken', 'variety'] },
  ],
  'Front Raise': [
    { name: 'Overhead Press', reason: 'Compound anterior delt movement', ratio: 3.5, tags: ['variety'] },
    { name: 'Lateral Raise', reason: 'Shifts emphasis to medial delt', ratio: 0.9, tags: ['variety'] },
    { name: 'Cable Front Raise', reason: 'Constant tension alternative', ratio: 0.9, tags: ['machine_taken', 'variety'] },
  ],
  'Shrugs': [
    { name: 'Dumbbell Shrug', reason: 'Better range of motion for traps', ratio: 0.45, tags: ['machine_taken', 'variety', 'hurts_wrist'] },
    { name: 'Upright Row', reason: 'Traps and medial delt combination', ratio: 0.5, tags: ['variety'] },
    { name: 'Face Pull', reason: 'Upper back and trap engagement with cable', ratio: 0.3, tags: ['machine_taken', 'variety'] },
  ],

  'Bicep Curl': [
    { name: 'Hammer Curl', reason: 'Hits brachialis and brachioradialis, less wrist stress', ratio: 0.95, tags: ['hurts_wrist', 'hurts_elbow', 'variety'] },
    { name: 'Preacher Curl', reason: 'Eliminates cheat, strict bicep isolation', ratio: 0.85, tags: ['variety', 'machine_taken'] },
    { name: 'Resistance Band Curl', reason: 'No dumbbells needed, constant tension', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Hammer Curl': [
    { name: 'Bicep Curl', reason: 'More bicep peak emphasis', ratio: 1.0, tags: ['variety'] },
    { name: 'Cross-body Hammer Curl', reason: 'Greater brachialis stretch', ratio: 1.0, tags: ['variety', 'hurts_elbow'] },
    { name: 'Preacher Curl', reason: 'Strict isolation, less joint stress', ratio: 0.8, tags: ['hurts_elbow', 'machine_taken'] },
  ],
  'Preacher Curl': [
    { name: 'Bicep Curl', reason: 'Free movement, can use more weight', ratio: 1.15, tags: ['machine_taken', 'variety'] },
    { name: 'Hammer Curl', reason: 'Wrist-neutral, easier on the elbow', ratio: 1.0, tags: ['hurts_elbow', 'hurts_wrist', 'machine_taken'] },
    { name: 'Resistance Band Curl', reason: 'No bench or machine needed', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],

  'Tricep Pushdown': [
    { name: 'Skull Crushers', reason: 'Long head stretch with greater range of motion', ratio: 0.45, tags: ['machine_taken', 'variety'] },
    { name: 'Dips', reason: 'Bodyweight tricep compound', ratio: null, tags: ['no_equipment', 'machine_taken'] },
    { name: 'Overhead Tricep Extension', reason: 'Long head emphasis with stretch at top', ratio: 0.5, tags: ['variety', 'machine_taken'] },
  ],
  'Dips': [
    { name: 'Tricep Pushdown', reason: 'Isolated tricep with adjustable load', ratio: 0.6, tags: ['hurts_shoulder', 'hurts_elbow', 'machine_taken'] },
    { name: 'Skull Crushers', reason: 'Long head stretch, lying version', ratio: 0.3, tags: ['variety', 'hurts_shoulder'] },
    { name: 'Close-grip Bench Press', reason: 'Barbell tricep press with more stability', ratio: 0.7, tags: ['hurts_shoulder', 'variety'] },
  ],
  'Skull Crushers': [
    { name: 'Tricep Pushdown', reason: 'Standing cable, less elbow stress', ratio: 1.8, tags: ['hurts_elbow', 'machine_taken'] },
    { name: 'Overhead Tricep Extension', reason: 'Dumbbell version, easier to load', ratio: 0.9, tags: ['hurts_elbow', 'variety'] },
    { name: 'Dips', reason: 'Bodyweight compound if no weights available', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],

  'Plank': [
    { name: 'Dead Bug', reason: 'Anti-extension core work, no lower back stress', ratio: null, tags: ['hurts_lower_back', 'variety'] },
    { name: 'Ab Wheel Rollout', reason: 'Progressive anti-extension', ratio: null, tags: ['variety', 'no_equipment'] },
    { name: 'Hollow Body Hold', reason: 'Full core tension, gymnastics base', ratio: null, tags: ['no_equipment', 'variety'] },
  ],

  // ── Additional exercises ────────────────────────────
  'Cable Fly': [
    { name: 'Dumbbell Fly', reason: 'Free-weight version, no cable stack needed', ratio: 0.9, tags: ['machine_taken', 'no_equipment'] },
    { name: 'Bench Press', reason: 'Compound push adds tricep drive', ratio: 2.0, tags: ['variety'] },
    { name: 'Chest Dip', reason: 'Bodyweight chest isolation', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Push-up': [
    { name: 'Bench Press', reason: 'Loaded version of the same horizontal push', ratio: 0.5, tags: ['variety', 'machine_taken'] },
    { name: 'Dumbbell Fly', reason: 'Pure chest stretch without tricep effort', ratio: 0.25, tags: ['variety'] },
    { name: 'Close-grip Push-up', reason: 'Tricep emphasis, same bodyweight pattern', ratio: null, tags: ['variety', 'no_equipment'] },
  ],
  'Close-grip Bench Press': [
    { name: 'Tricep Pushdown', reason: 'Cable isolation with less shoulder stress', ratio: 0.7, tags: ['hurts_shoulder', 'variety'] },
    { name: 'Skull Crushers', reason: 'Long head stretch on same bench', ratio: 0.65, tags: ['variety'] },
    { name: 'Dips', reason: 'Bodyweight tricep compound', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],

  'Bulgarian Split Squat': [
    { name: 'Squat', reason: 'Bilateral compound with more total load', ratio: 1.6, tags: ['variety', 'hurts_lower_back'] },
    { name: 'Leg Press', reason: 'Seated bilateral push, easier on balance', ratio: 3.0, tags: ['machine_taken', 'variety'] },
    { name: 'Step-up', reason: 'Unilateral movement with less hip flexor stretch', ratio: 0.9, tags: ['no_equipment', 'variety'] },
  ],
  'Hack Squat': [
    { name: 'Leg Press', reason: 'Similar machine push pattern', ratio: 1.0, tags: ['machine_taken', 'variety'] },
    { name: 'Squat', reason: 'Free-weight compound with full-body engagement', ratio: 0.6, tags: ['no_equipment', 'variety'] },
    { name: 'Leg Extension', reason: 'Isolated quad work if machines are taken', ratio: 0.25, tags: ['machine_taken', 'variety'] },
  ],
  'Sumo Deadlift': [
    { name: 'Romanian Deadlift', reason: 'Hip hinge without wide stance stress', ratio: 0.85, tags: ['variety', 'hurts_lower_back'] },
    { name: 'Hip Thrust', reason: 'Glute emphasis without spinal loading', ratio: 0.9, tags: ['hurts_lower_back', 'variety'] },
    { name: 'Leg Press', reason: 'Quad and glute drive without lower back load', ratio: 1.8, tags: ['hurts_lower_back', 'machine_taken'] },
  ],
  'Nordic Curl': [
    { name: 'Leg Curl', reason: 'Machine version, easier to control load', ratio: 0.4, tags: ['machine_taken', 'variety'] },
    { name: 'Romanian Deadlift', reason: 'Hip hinge for hamstring length', ratio: 2.5, tags: ['variety', 'machine_taken'] },
    { name: 'Glute Bridge', reason: 'Posterior chain work with no equipment', ratio: null, tags: ['no_equipment'] },
  ],
  'Glute Bridge': [
    { name: 'Hip Thrust', reason: 'Extended range of motion with bench elevation', ratio: 1.0, tags: ['variety', 'machine_taken'] },
    { name: 'Romanian Deadlift', reason: 'Hip hinge with more hamstring involvement', ratio: 1.0, tags: ['variety'] },
    { name: 'Squat', reason: 'Compound lower body with glute activation', ratio: 0.8, tags: ['variety', 'machine_taken'] },
  ],
  'Seated Calf Raise': [
    { name: 'Calf Raise', reason: 'Standing version hits gastrocnemius more', ratio: 1.3, tags: ['machine_taken', 'variety'] },
    { name: 'Leg Press Calf Press', reason: 'Plate-loaded calf press on leg press', ratio: 1.5, tags: ['machine_taken', 'variety'] },
  ],
  'Step-up': [
    { name: 'Bulgarian Split Squat', reason: 'Greater glute and quad stretch', ratio: 1.0, tags: ['variety'] },
    { name: 'Squat', reason: 'Bilateral compound for more load', ratio: 1.5, tags: ['variety', 'machine_taken'] },
    { name: 'Leg Press', reason: 'Seated bilateral, easier on balance', ratio: 2.5, tags: ['machine_taken', 'variety'] },
  ],

  'Trap Bar Deadlift': [
    { name: 'Deadlift', reason: 'Standard barbell version for carry-over', ratio: 1.0, tags: ['variety', 'machine_taken'] },
    { name: 'Romanian Deadlift', reason: 'Hip hinge focus with less lower back stress', ratio: 0.75, tags: ['hurts_lower_back', 'variety'] },
    { name: 'Leg Press', reason: 'Quad and glute push if deadlift space is taken', ratio: 2.5, tags: ['machine_taken', 'hurts_lower_back'] },
  ],
  'T-Bar Row': [
    { name: 'Barbell Row', reason: 'Similar movement with more grip variety', ratio: 0.9, tags: ['machine_taken', 'variety'] },
    { name: 'Seated Cable Row', reason: 'Cable keeps tension constant', ratio: 1.0, tags: ['machine_taken', 'hurts_lower_back'] },
    { name: 'Dumbbell Row', reason: 'Unilateral with better range of motion', ratio: 0.45, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Dumbbell Row': [
    { name: 'Barbell Row', reason: 'Bilateral load, heavier total weight', ratio: 2.0, tags: ['variety', 'machine_taken'] },
    { name: 'Seated Cable Row', reason: 'Cable version with constant tension', ratio: 2.0, tags: ['machine_taken', 'variety'] },
    { name: 'T-Bar Row', reason: 'Supported chest allows heavier load', ratio: 2.0, tags: ['variety'] },
  ],
  'Chest-Supported Row': [
    { name: 'Dumbbell Row', reason: 'Free-weight version, no special bench needed', ratio: 1.0, tags: ['machine_taken', 'no_equipment'] },
    { name: 'Seated Cable Row', reason: 'Constant tension from cable', ratio: 1.0, tags: ['machine_taken', 'variety'] },
    { name: 'Barbell Row', reason: 'Compound free-weight back builder', ratio: 0.8, tags: ['machine_taken', 'variety'] },
  ],
  'Cable Pullover': [
    { name: 'Lat Pulldown', reason: 'Vertical pull for lat width', ratio: 1.2, tags: ['machine_taken', 'variety'] },
    { name: 'Dumbbell Pullover', reason: 'Dumbbell version over a bench', ratio: 0.5, tags: ['no_equipment', 'machine_taken'] },
    { name: 'Pull-up', reason: 'Bodyweight lat activation', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],

  'Dumbbell Shoulder Press': [
    { name: 'Overhead Press', reason: 'Barbell allows heavier total load', ratio: 2.0, tags: ['variety', 'machine_taken'] },
    { name: 'Arnold Press', reason: 'More rotation hits all three delt heads', ratio: 0.9, tags: ['variety'] },
    { name: 'Lateral Raise', reason: 'Medial delt isolation if pressing hurts', ratio: 0.2, tags: ['hurts_shoulder', 'hurts_elbow'] },
  ],
  'Arnold Press': [
    { name: 'Dumbbell Shoulder Press', reason: 'Standard press without rotational stress', ratio: 1.1, tags: ['hurts_shoulder', 'hurts_elbow', 'variety'] },
    { name: 'Overhead Press', reason: 'Barbell compound press', ratio: 2.1, tags: ['variety', 'machine_taken'] },
    { name: 'Lateral Raise', reason: 'Side delt isolation, no pressing movement', ratio: 0.2, tags: ['hurts_shoulder'] },
  ],
  'Upright Row': [
    { name: 'Lateral Raise', reason: 'Same medial delt target, less shoulder impingement risk', ratio: 0.4, tags: ['hurts_shoulder', 'variety'] },
    { name: 'Face Pull', reason: 'Rear delt and trap, safer shoulder position', ratio: 0.5, tags: ['hurts_shoulder', 'variety'] },
    { name: 'Shrugs', reason: 'Trap isolation without shoulder impingement', ratio: 1.5, tags: ['hurts_shoulder', 'variety'] },
  ],
  'Reverse Fly': [
    { name: 'Face Pull', reason: 'Cable version targets same rear delt fibers', ratio: 1.5, tags: ['machine_taken', 'variety'] },
    { name: 'Band Pull-apart', reason: 'Rear delt work with resistance band only', ratio: null, tags: ['no_equipment', 'machine_taken'] },
    { name: 'Lateral Raise', reason: 'Shifts to medial delt if rear delt is sensitive', ratio: 0.9, tags: ['hurts_shoulder', 'variety'] },
  ],
  'Cable Lateral Raise': [
    { name: 'Lateral Raise', reason: 'Dumbbell version, no cable needed', ratio: 1.0, tags: ['machine_taken', 'no_equipment'] },
    { name: 'Overhead Press', reason: 'Compound shoulder movement for more volume', ratio: 4.5, tags: ['variety'] },
    { name: 'Face Pull', reason: 'Rear delt balance to complement medial work', ratio: 1.5, tags: ['variety'] },
  ],

  'EZ Bar Curl': [
    { name: 'Bicep Curl', reason: 'Dumbbell version, no EZ bar needed', ratio: 0.45, tags: ['no_equipment', 'machine_taken'] },
    { name: 'Hammer Curl', reason: 'Neutral grip reduces wrist stress', ratio: 0.9, tags: ['hurts_wrist', 'hurts_elbow'] },
    { name: 'Preacher Curl', reason: 'Strict isolation on the preacher bench', ratio: 0.85, tags: ['variety'] },
  ],
  'Cable Curl': [
    { name: 'Bicep Curl', reason: 'Dumbbell version, no cable needed', ratio: 0.5, tags: ['no_equipment', 'machine_taken'] },
    { name: 'EZ Bar Curl', reason: 'Barbell version for heavier load', ratio: 1.8, tags: ['machine_taken', 'variety'] },
    { name: 'Preacher Curl', reason: 'Strict form with no momentum', ratio: 0.9, tags: ['variety', 'machine_taken'] },
  ],
  'Concentration Curl': [
    { name: 'Preacher Curl', reason: 'Bench-supported isolation, similar angle', ratio: 1.0, tags: ['machine_taken', 'variety'] },
    { name: 'Bicep Curl', reason: 'Standing curl, allows more load', ratio: 1.2, tags: ['variety'] },
    { name: 'Cable Curl', reason: 'Constant tension through the arc', ratio: 1.0, tags: ['machine_taken', 'variety'] },
  ],
  'Overhead Tricep Extension': [
    { name: 'Skull Crushers', reason: 'Similar long head stretch on a flat bench', ratio: 1.0, tags: ['machine_taken', 'variety'] },
    { name: 'Tricep Pushdown', reason: 'Cable version, easier on the elbow', ratio: 1.8, tags: ['hurts_elbow', 'machine_taken'] },
    { name: 'Close-grip Bench Press', reason: 'Compound tricep movement with more load', ratio: 1.5, tags: ['variety'] },
  ],
  'Cable Tricep Kickback': [
    { name: 'Tricep Pushdown', reason: 'Heavier cable isolation, more load', ratio: 2.0, tags: ['machine_taken', 'variety'] },
    { name: 'Overhead Tricep Extension', reason: 'Long head emphasis with greater stretch', ratio: 1.0, tags: ['variety'] },
    { name: 'Dips', reason: 'Bodyweight compound, no cable needed', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Close-grip Push-up': [
    { name: 'Tricep Pushdown', reason: 'Weighted isolation with cable', ratio: 0.3, tags: ['variety', 'machine_taken'] },
    { name: 'Dips', reason: 'More load via bodyweight lever', ratio: null, tags: ['variety', 'no_equipment'] },
    { name: 'Close-grip Bench Press', reason: 'Loaded barbell version of the same pattern', ratio: 0.5, tags: ['machine_taken', 'variety'] },
  ],

  'Ab Wheel Rollout': [
    { name: 'Plank', reason: 'Anti-extension hold, easier to recover from', ratio: null, tags: ['variety', 'no_equipment'] },
    { name: 'Cable Crunch', reason: 'Weighted core flexion with cable', ratio: null, tags: ['machine_taken', 'variety'] },
    { name: 'Hanging Leg Raise', reason: 'Hip flexor and core, same difficulty level', ratio: null, tags: ['variety', 'no_equipment'] },
  ],
  'Hanging Leg Raise': [
    { name: 'Ab Wheel Rollout', reason: 'Anti-extension core challenge', ratio: null, tags: ['variety', 'no_equipment'] },
    { name: 'Cable Crunch', reason: 'Weighted flexion, easier on grip', ratio: null, tags: ['machine_taken', 'variety'] },
    { name: 'Plank', reason: 'Isometric core hold if bar is occupied', ratio: null, tags: ['no_equipment', 'machine_taken'] },
  ],
  'Cable Crunch': [
    { name: 'Ab Wheel Rollout', reason: 'Bodyweight anti-extension, no cable needed', ratio: null, tags: ['machine_taken', 'no_equipment'] },
    { name: 'Hanging Leg Raise', reason: 'Hip flexor and lower ab emphasis', ratio: null, tags: ['variety', 'machine_taken'] },
    { name: 'Russian Twist', reason: 'Rotational core work for obliques', ratio: null, tags: ['variety', 'no_equipment'] },
  ],
  'Incline Dumbbell Curl': [
    { name: 'Bicep Curl', reason: 'Standing version, easier to load heavier', ratio: 1.1, tags: ['variety', 'machine_taken'] },
    { name: 'Preacher Curl', reason: 'Strict isolation at a similar stretched angle', ratio: 0.9, tags: ['variety', 'machine_taken'] },
    { name: 'Cable Curl', reason: 'Constant tension through the curl arc', ratio: 1.0, tags: ['machine_taken', 'variety'] },
  ],
  'Cable Overhead Extension': [
    { name: 'Skull Crushers', reason: 'Free-weight long head stretch, no cable needed', ratio: 0.9, tags: ['machine_taken', 'no_equipment'] },
    { name: 'Overhead Tricep Extension', reason: 'Dumbbell version of the same movement pattern', ratio: 0.9, tags: ['machine_taken', 'variety'] },
    { name: 'Tricep Pushdown', reason: 'Cable tricep isolation with less shoulder involvement', ratio: 1.8, tags: ['hurts_shoulder', 'variety'] },
  ],
  'Single-Arm Cable Curl': [
    { name: 'Concentration Curl', reason: 'Unilateral dumbbell isolation, no cable needed', ratio: 1.0, tags: ['machine_taken', 'no_equipment'] },
    { name: 'Hammer Curl', reason: 'Neutral grip hits brachialis too', ratio: 1.0, tags: ['variety', 'hurts_wrist'] },
    { name: 'Cable Curl', reason: 'Two-arm cable version on the same stack', ratio: 1.0, tags: ['machine_taken', 'variety'] },
  ],
  'Single-Arm Cable Tricep Extension': [
    { name: 'Cable Tricep Kickback', reason: 'Similar unilateral isolation on the same cable', ratio: 0.9, tags: ['machine_taken', 'variety'] },
    { name: 'Tricep Pushdown', reason: 'Two-arm cable version, more total load', ratio: 1.8, tags: ['variety'] },
    { name: 'Overhead Tricep Extension', reason: 'Long head emphasis with a dumbbell', ratio: 0.9, tags: ['machine_taken', 'no_equipment'] },
  ],

  'Dumbbell Calf Raise': [
    { name: 'Calf Raise', reason: 'Standing barbell version allows heavier load', ratio: 2.0, tags: ['variety', 'machine_taken'] },
    { name: 'Seated Calf Raise', reason: 'Targets soleus with bent-knee position', ratio: 0.7, tags: ['machine_taken', 'variety'] },
    { name: 'Jump Rope', reason: 'Explosive calf activation, no equipment needed', ratio: null, tags: ['no_equipment', 'variety'] },
  ],

  'Russian Twist': [
    { name: 'Cable Crunch', reason: 'Weighted core flexion with more resistance', ratio: null, tags: ['variety', 'machine_taken'] },
    { name: 'Plank', reason: 'Full core isometric hold', ratio: null, tags: ['variety', 'no_equipment'] },
    { name: 'Hanging Leg Raise', reason: 'Anti-gravity core challenge', ratio: null, tags: ['variety', 'no_equipment'] },
  ],
}

// Pain location → tag mapping
export const PAIN_TAG = {
  'Shoulder': 'hurts_shoulder',
  'Elbow': 'hurts_elbow',
  'Wrist': 'hurts_wrist',
  'Lower Back': 'hurts_lower_back',
}

// Reason → tag mapping
export const REASON_TAG = {
  'machine_taken': 'machine_taken',
  'no_equipment': 'no_equipment',
  'variety': 'variety',
  'something_hurts': null, // requires pain loc sub-step
}

/**
 * Returns up to 3 swap suggestions for an exercise + filter tag.
 * @param {string} exerciseName  - exact exercise name
 * @param {string} tag           - one of the tag strings
 * @returns {Array<{name, reason, ratio}>}
 */
export function getSwaps(exerciseName, tag) {
  const candidates = SWAPS[exerciseName] || []
  const filtered = candidates.filter(s => s.tags.includes(tag))
  return (filtered.length ? filtered : candidates).slice(0, 3)
}
