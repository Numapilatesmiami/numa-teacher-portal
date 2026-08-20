// ===== NUMA Pilates Certification Portal — Course Content =====

const COURSE_MODULES = [
  // ========== MODULE 1 ==========
  {
    id: 1,
    title: "History of Pilates & Foundations",
    week: "Week 1",
    description: "Explore the origins of the Pilates method, from Joseph Pilates' early life to the modern-day evolution of Classical and Contemporary approaches.",
    icon: "fa-book-open",
    sections: [
      {
        id: "1-1",
        title: "Joseph Pilates — Biography & Legacy",
        content: `<div class="section-image"><img src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&h=400&fit=crop" alt="Pilates studio" loading="lazy"><p class="image-caption">The Pilates method has grown from a single New York studio to studios worldwide.</p></div>
<h2>Joseph Hubertus Pilates — Biography & Legacy</h2>
<p>Joseph Hubertus Pilates was born on <strong>9 December 1883</strong> near Düsseldorf, Germany, and died <strong>9 October 1967</strong> in New York City at age 83. He was a German physical trainer, writer, and inventor credited with inventing and promoting the Pilates method of physical fitness. Over his lifetime he patented a total of <strong>26 apparatuses</strong>.</p>

<p>As a child Pilates was reportedly frail, suffering from asthma, rickets, and rheumatic fever. This drove him to study anatomy and master physical conditioning disciplines including gymnastics, martial arts, boxing, and wrestling. By the time he was a teenager he had achieved sufficient body development to pose as a model for anatomical charts.</p>

<h3>World War I and the Birth of Contrology</h3>
<p>During WWI, Pilates was interned in England as a German national. During that period of forced confinement he began developing his comprehensive system of physical exercise, which he called <strong>"Contrology"</strong> — the complete coordination of body, mind, and spirit through conscious control over every movement.</p>
<p>He attached bed springs to hospital beds to help support and rehabilitate injured or bed-ridden internees, laying the foundation for what would later become the <strong>Cadillac</strong> (Trapeze Table).</p>

<h3>The New York Studio</h3>
<p>Pilates emigrated to the United States with his wife Clara in the early 1920s. Together they opened their "Body Conditioning Gym" at <strong>939 Eighth Avenue in New York City</strong> in 1926. The studio was located in the same building as several major dance companies and quickly became a destination for dancers, athletes, and individuals seeking rehabilitation.</p>

<h3>Published Works</h3>
<p>Pilates documented his philosophy and method in two major works:</p>
<ul>
<li><em>Your Health</em> (1934) — introduced his early concepts</li>
<li><em>Return to Life Through Contrology</em> (1945) — the definitive guide to his 34 Mat exercises, including photos of Joseph himself demonstrating each movement</li>
</ul>
<p>Joseph Pilates taught actively until his death in 1967. During his lifetime, his method was known as <strong>Contrology</strong>. It was only after his death that it became broadly known as the <strong>Pilates Method</strong>.</p>`
      },
      {
        id: "1-2",
        title: "Clara Pilates & The Elders",
        content: `<h2>Clara Pilates</h2>
<p>Clara was a kindergarten teacher whom Joseph met on the ship to America. They married and she became the primary teaching presence in the studio — the nurturing force behind the method's transmission. Clara established the tradition of adapting the method to individual clients' needs.</p>
<p>After Joseph's death in 1967, Clara continued teaching at the studio until <strong>1971</strong>, when she retired and entrusted the studio to Romana Kryzanowska. Clara died in <strong>1977</strong>.</p>

<h2>The Pilates Elders</h2>
<p>The "Pilates Elders" are the first generation of teachers trained directly by Joseph and Clara Pilates. Because Joseph never established a formal certification program, these individuals interpreted and carried forward the method.</p>

<h3>Romana Kryzanowska (1923–2013)</h3>
<p>Romana was introduced to Joseph Pilates in the early 1940s by George Balanchine following an ankle injury. When Clara retired in 1971, she took over operation of the Pilates studio. Her commitment was to <strong>maintain the integrity of the original work as closely as possible</strong>. She often said: <em>"I am not a genius. He was. I just try to teach what he taught me."</em></p>
<p>Her lineage is most closely associated with the term "Classical Pilates" today. She added structural elements such as levels (Basic/Intermediate/Advanced) for safety.</p>

<h3>Ron Fletcher (1921–2011)</h3>
<p>A member of the Martha Graham Dance Company, Fletcher incorporated his <strong>modern dance and theatrical background</strong>, adding a rhythmic and percussive breath element (Fletcher "percussive breath"). He is famous for his towel work and his "clock" exercise.</p>

<h3>Eve Gentry (1909–1994)</h3>
<p>A master of modern dance who worked with Joseph Pilates for over <strong>20 years</strong>. She developed <strong>"Pre-Pilates"</strong> — modified, preparatory movements for those who cannot yet perform the full repertoire. In 1991 she co-founded the <strong>Institute for the Pilates Method</strong>.</p>

<h3>Carola Trier (1913–2000)</h3>
<p>Originally from Germany, Carola was an acrobat and dancer who studied anatomy at Lennox Hill Hospital. She identified and addressed common alignment problems in dancers and developed corrective exercises.</p>

<h3>Kathy Grant (1921–2010)</h3>
<p>Kathleen Stanford Grant was <strong>one of only two people</strong> to receive official Pilates certification through a federally supervised program. She developed many innovations, including her "Caesarean abs" approach.</p>

<h3>Other Notable Elders</h3>
<ul>
<li><strong>Lolita San Miguel</strong> — certified alongside Kathy Grant; active internationally for decades</li>
<li><strong>Mary Bowen</strong> — integrated Jungian psychology with Pilates</li>
<li><strong>Alan Herdman</strong> — brought Pilates to the UK in the early 1970s</li>
</ul>`
      },
      {
        id: "1-3",
        title: "The Six Principles of Contrology",
        content: `<div class="section-image"><img src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=400&fit=crop" alt="Pilates mat class" loading="lazy"><p class="image-caption">The six principles guide every Pilates movement — from the simplest breathing exercise to the most advanced sequence.</p></div>
<h2>The Six Principles of Contrology</h2>
<p>Joseph Pilates articulated core philosophical principles, subsequently codified by later teachers as the "Six Principles":</p>

<div class="exercise-card">
<h4>1. Concentration</h4>
<p>Intense mental focus on the quality and intention of each movement. Every Pilates exercise begins in the mind. The practitioner must be fully present, directing awareness to the body and the specific muscles being engaged.</p>
</div>

<div class="exercise-card">
<h4>2. Centering</h4>
<p>All movement originates from the core — the <strong>"Powerhouse"</strong> (deep abdominals, pelvic floor, hip flexors, glutes, lower back). The Powerhouse is the physical and energetic center from which all movement radiates outward.</p>
</div>

<div class="exercise-card">
<h4>3. Control</h4>
<p>Deliberate, conscious muscular command throughout every exercise. This is why Pilates originally named his method <strong>"Contrology"</strong> — the science and art of control. No movement is casual or careless.</p>
</div>

<div class="exercise-card">
<h4>4. Precision</h4>
<p>Executing movements with exactness; quality over quantity. Every angle of the body, every position of the limbs, is intentional. Precision distinguishes Pilates from general exercise.</p>
</div>

<div class="exercise-card">
<h4>5. Flow</h4>
<p>Smooth, graceful, efficient transitions between exercises. Movement as continuous energy. In classical Pilates, the transitions between exercises are as important as the exercises themselves.</p>
</div>

<div class="exercise-card">
<h4>6. Breath</h4>
<p><em>"Above all, learn how to breathe correctly."</em> — Joseph Pilates</p>
<p>Breath is not merely accompaniment to movement — it is the engine that drives it. Pilates breathing coordinates with movement to enhance core engagement and oxygenate the muscles.</p>
</div>`
      },
      {
        id: "1-4",
        title: "Classical vs. Contemporary Evolution",
        content: `<h2>The Evolution from Classical to Contemporary</h2>
<h3>Classical Pilates</h3>
<p><strong>Classical Pilates</strong> refers to approaches that adhere closely to the original system:</p>
<ul>
<li>The 34 Mat exercises in their original sequence</li>
<li>The established apparatus repertoire</li>
<li>Apparatus built to Joseph Pilates' specifications</li>
<li>Strict preservation of his core principles</li>
</ul>
<p>The lineage through Romana Kryzanowska is most frequently associated with this term.</p>

<h3>Contemporary Pilates</h3>
<p><strong>Contemporary Pilates</strong> encompasses approaches that modify the original work based on modern biomechanical research, sports medicine, and physical therapy principles:</p>
<ul>
<li>Alter exercises based on modern biomechanical understanding</li>
<li>Introduce new exercises and variations</li>
<li>Add props not in the original work</li>
<li>Use updated apparatus designs</li>
<li>De-emphasize strict sequencing</li>
<li>Integrate concepts from physical therapy, functional movement, or other modalities</li>
</ul>

<h3>Key Contemporary Schools</h3>
<p>Contemporary approaches emerged from physical therapists and movement scientists who integrated rehabilitation science with Pilates principles. Rather than a single school, several lineages developed independently:</p>
<table>
<tr><th>School</th><th>Founder(s)</th><th>Key Focus</th></tr>
<tr><td><strong>BASI Pilates</strong></td><td>Rael Isacowitz</td><td>Body Arts & Science International; comprehensive evidence-based training</td></tr>
<tr><td><strong>Polestar Pilates</strong></td><td>Brent Anderson & Elizabeth Larkam</td><td>Significant rehabilitation and physical therapy focus</td></tr>
<tr><td><strong>Modern methodology programs</strong></td><td>Various physical therapists and movement scientists</td><td>Neutral spine, three-dimensional movement, evidence-informed practice</td></tr>
</table>
<p>All contemporary approaches maintain that the foundational principles — breath, centering, control, precision, flow, concentration — remain central. What changes is the <em>how</em>, not the <em>why</em>.</p>`
      },
      {
        id: "1-5",
        title: "Contemporary Teaching Approaches",
        content: `<h2>Contemporary Teaching Approaches</h2>
<p>Contemporary Pilates approaches emerged from physical therapists and movement scientists who integrated rehabilitation science with Pilates principles. These approaches share the classical foundation — breath, centering, control, precision, flow — while incorporating modern biomechanics research.</p>

<h3>Key Principles of Contemporary Approaches</h3>
<ul>
<li><strong>Movement Principle Perspective</strong> — exercises taught as expressions of fundamental movement principles rather than fixed sequences</li>
<li><strong>Evidence-Informed + Classical Integration</strong> — bridges classical Pilates and contemporary exercise science</li>
<li><strong>Client-Specific Application</strong> — exercise progressions and regressions are central to teaching</li>
<li><strong>Teaching Over Performance</strong> — develops instructors, not just practitioners</li>
<li><strong>Anatomy as Foundation</strong> — deep anatomy study is required across all reputable programs</li>
</ul>

<p><strong>In simple terms:</strong> Contemporary programs ask "what does the research say?" while keeping the spirit of the original method alive. Think of it like a recipe that gets updated when we learn better cooking techniques — the dish is still recognizable, but it's safer and more effective.</p>

<h2>The Five Principles of the Contemporary Approach</h2>
<p>The modern methodology built on the original six principles and added specific anatomical focus points:</p>
<ol>
<li><strong>Breathing</strong> — Three-dimensional lateral breathing; exhale facilitates flexion, inhale facilitates extension. <em>Think of your ribcage like an accordion that expands sideways.</em></li>
<li><strong>Pelvic Placement</strong> — Neutral vs. Imprint positions; neutral spine as the default starting point</li>
<li><strong>Rib Cage Placement</strong> — Maintaining alignment of the thoracic spine; ribs stay "heavy" rather than flaring up</li>
<li><strong>Scapular Movement & Stabilization</strong> — Dynamic shoulder blade control; blades glide, they don't grip</li>
<li><strong>Head & Cervical Placement</strong> — Natural cervical curve maintenance; chin neither tucked hard nor jutting forward</li>
</ol>

<h3>Classical vs. Contemporary: Key Differences</h3>
<table>
<tr><th>Dimension</th><th>Classical</th><th>Contemporary</th></tr>
<tr><td>Spinal alignment</td><td>Often imprinted (flat) spine</td><td>Neutral spine as default</td></tr>
<tr><td>Sequence</td><td>Fixed classical order</td><td>More flexible; instructor designs for client</td></tr>
<tr><td>Props</td><td>Minimal (mat + apparatus)</td><td>Extensive prop use for progression/regression</td></tr>
<tr><td>Pre-Pilates preparation</td><td>Not formally structured</td><td>Formal preparation progressions for beginners</td></tr>
<tr><td>Biomechanical basis</td><td>Original Contrology philosophy</td><td>Modern physical therapy and biomechanics</td></tr>
<tr><td>Movement plane</td><td>Primarily sagittal (front-to-back)</td><td>Three-dimensional — all planes of movement</td></tr>
</table>

<h3>Notable Contemporary Schools</h3>
<p>Contemporary approaches emerged from multiple lineages. BASI Pilates (Rael Isacowitz) focuses on Body Arts and Science International principles. Polestar Pilates (Brent Anderson and Elizabeth Larkam) has a significant rehabilitation focus. Contemporary training programs across the world share the commitment to evidence-informed practice while honoring the foundational principles Pilates established.</p>
<p>All contemporary approaches maintain that the core principles — breath, centering, control, precision, flow, concentration — remain central to effective practice and teaching.</p>`
      },
      {
        id: "1-quiz",
        title: "Module 1 Quiz",
        isQuiz: true
      }
    ],
    quiz: generateModule1Quiz()
  },

  // ========== MODULE 2 ==========
  {
    id: 2,
    title: "Anatomy, Physiology & Biomechanics",
    week: "Weeks 2–3",
    description: "Master the anatomical foundations essential for safe, effective Pilates instruction — from the core cylinder to spinal biomechanics.",
    icon: "fa-bone",
    sections: [
      {
        id: "2-1",
        title: "The Core Cylinder",
        content: `<div class="section-image"><img src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop" alt="Anatomy and body mechanics" loading="lazy"><p class="image-caption">The core cylinder — four deep muscles working as a coordinated pressure system to support the spine.</p></div>
<h2>The Core Cylinder — Clinical Model</h2>
<p><strong>In simple terms:</strong> Imagine your torso as a soda can. The four deep core muscles form a <strong>pressure cylinder</strong> (like the walls of the can) enclosing the lumbar spine and abdominal contents. When these muscles work together, they generate intra-abdominal pressure (IAP) — think of it like inflating the can from the inside. This is the hydraulic mechanism that stabilizes the lumbar spine from within, and it's the biomechanical basis of the Pilates "powerhouse."</p>

<div class="exercise-card">
<h4>Transversus Abdominis (TVA)</h4>
<p><strong>Anatomy:</strong> Deepest abdominal muscle layer; fibres run <em>horizontally</em> like a wide corset around the waist. <strong>Think of it like:</strong> a natural weight-lifting belt your body already has built in.</p>
<p><strong>Function:</strong> Primary stabilizer of the lumbar spine and pelvis. It activates <em>before</em> limb movement (this is called the feedforward mechanism — your body pre-braces before you even move your arm or leg). It does not perform spinal flexion — it is a stabilizer, not a mover.</p>
<p><strong>Clinical importance:</strong> The TVA is frequently inhibited in people with low back pain. Retraining it is foundational to Pilates practice.</p>
<p><strong>Activation cue:</strong> "Gently draw your navel away from your waistband towards your spine" — without flattening the lumbar curve or holding breath.</p>
</div>

<div class="exercise-card">
<h4>Multifidus</h4>
<p><strong>Anatomy:</strong> Deep posterior muscle running along the spine, connecting individual vertebrae to vertebrae 2–3 levels above. Densest at L4–L5.</p>
<p><strong>Function:</strong> Provides <em>segmental</em> stabilization — holds space between individual vertebrae, protects intervertebral discs and nerve roots.</p>
<p><strong>Clinical importance:</strong> After an episode of acute low back pain, the multifidus does <em>not</em> spontaneously recover — it requires specific retraining.</p>
</div>

<div class="exercise-card">
<h4>Pelvic Floor Muscles</h4>
<p><strong>Anatomy:</strong> A hammock-shaped group of muscles spanning the base of the pelvis (levator ani group + coccygeus).</p>
<p><strong>Function:</strong> Sphincteric control, support of pelvic organs, acts as the <em>floor of the core cylinder</em>.</p>
<p><strong>Important:</strong> The pelvic floor can also be <em>too tight</em> (hypertonic) — causing pelvic pain and incontinence. Instructors must understand both strengthening AND releasing.</p>
</div>

<div class="exercise-card">
<h4>Diaphragm</h4>
<p><strong>Anatomy:</strong> Dome-shaped structure forming the <em>roof of the core cylinder</em>.</p>
<p><strong>Function:</strong> Primary muscle of respiration. On inhalation, contracts and descends; on exhalation, relaxes and rises.</p>
<p><strong>Pilates relevance:</strong> The diaphragm is integral to core stability. Pilates breathing significantly increases TVA/internal oblique and multifidus activity (Park et al., 2017).</p>
</div>

<blockquote>Research confirms that co-contraction of TVA and multifidus via the abdominal drawing-in maneuver (ADIM) decreases pain and improves function in people with low back pain (Chon et al., 2010; Lynders, 2019, HSS Journal).</blockquote>`
      },
      {
        id: "2-2",
        title: "Muscular System for Pilates",
        content: `<h2>Major Muscle Groups for Pilates</h2>

<h3>Abdominal Muscles — Outer Unit</h3>
<table>
<tr><th>Muscle</th><th>Layer</th><th>Fibre Direction</th><th>Action</th></tr>
<tr><td><strong>Rectus Abdominis</strong></td><td>Superficial</td><td>Vertical</td><td>Trunk flexion; "six-pack"</td></tr>
<tr><td><strong>External Obliques</strong></td><td>Superficial</td><td>Diagonal ↘</td><td>Flexion, rotation to opposite side, lateral flexion</td></tr>
<tr><td><strong>Internal Obliques</strong></td><td>Middle</td><td>Diagonal ↗</td><td>Flexion, rotation to same side, lateral flexion</td></tr>
<tr><td><strong>TVA</strong></td><td>Deep</td><td>Horizontal</td><td>Spinal stabilization</td></tr>
</table>

<h3>Back Muscles</h3>
<ul>
<li><strong>Erector Spinae</strong> (iliocostalis, longissimus, spinalis) — Primary spinal extensors; prone to overactivity when deep stabilizers are inhibited</li>
<li><strong>Quadratus Lumborum (QL)</strong> — Lateral flexor; often tight and overactive in LBP</li>
<li><strong>Latissimus Dorsi</strong> — Shoulder extension/adduction; connects to glute max via thoracolumbar fascia</li>
</ul>

<h3>Gluteal Group</h3>
<table>
<tr><th>Muscle</th><th>Action</th><th>Pilates Relevance</th></tr>
<tr><td><strong>Gluteus Maximus</strong></td><td>Hip extension, external rotation</td><td>Bridging, arabesque, standing work</td></tr>
<tr><td><strong>Gluteus Medius</strong></td><td>Hip abduction, pelvic stabilization</td><td>Side-lying series; single-leg work</td></tr>
<tr><td><strong>Gluteus Minimus</strong></td><td>Hip abduction, internal rotation</td><td>Works with medius</td></tr>
<tr><td><strong>Piriformis</strong></td><td>Hip external rotation, SI joint stabilizer</td><td>Relevant in sciatica</td></tr>
</table>

<h3>Hip Flexors</h3>
<ul>
<li><strong>Iliopsoas</strong> — Primary hip flexor; psoas originates from lumbar vertebrae making it a direct stabilizer/destabilizer of the lumbar spine</li>
<li><strong>Rectus Femoris</strong> — Crosses both hip and knee; can dominate when iliopsoas is inhibited</li>
</ul>

<h3>Shoulder & Scapular Muscles</h3>
<p><strong>Rotator Cuff (SITS):</strong> Supraspinatus, Infraspinatus, Teres Minor, Subscapularis — their primary function is to center the humeral head in the glenoid during elevation.</p>
<table>
<tr><th>Scapular Muscle</th><th>Action</th><th>Pilates Cueing</th></tr>
<tr><td><strong>Serratus Anterior</strong></td><td>Protraction, upward rotation</td><td>"Spread your shoulder blades"</td></tr>
<tr><td><strong>Lower Trapezius</strong></td><td>Depression, upward rotation</td><td>"Draw shoulder blades down your back"</td></tr>
<tr><td><strong>Upper Trapezius</strong></td><td>Elevation</td><td>Often overactive; cue to soften</td></tr>
</table>`
      },
      {
        id: "2-3",
        title: "Skeletal System & Joint Mechanics",
        content: `<h2>The Skeletal System — Spinal Anatomy</h2>
<p>The spine consists of <strong>24 mobile vertebrae</strong> plus the fused sacrum and coccyx.</p>

<table>
<tr><th>Region</th><th>Vertebrae</th><th>Curve</th><th>Primary Movements</th><th>Pilates Relevance</th></tr>
<tr><td><strong>Cervical</strong></td><td>C1–C7</td><td>Lordosis</td><td>Flexion, extension, rotation, lateral flexion</td><td>Head/neck alignment in ab exercises</td></tr>
<tr><td><strong>Thoracic</strong></td><td>T1–T12</td><td>Kyphosis</td><td>Rotation, lateral flexion</td><td>Rib cage mobility; spinal articulation</td></tr>
<tr><td><strong>Lumbar</strong></td><td>L1–L5</td><td>Lordosis</td><td>Flexion, extension; minimal rotation</td><td>Core loading; neutral vs. imprint</td></tr>
<tr><td><strong>Sacral</strong></td><td>S1–S5 (fused)</td><td>Kyphosis</td><td>Nutation/counternutation at SI</td><td>Pelvic floor; alignment</td></tr>
<tr><td><strong>Coccyx</strong></td><td>3–5 (fused)</td><td>Slight forward</td><td>—</td><td>Tailbone positioning</td></tr>
</table>

<h3>Key Skeletal Landmarks for Pilates</h3>
<ul>
<li><strong>ASIS</strong> (anterior superior iliac spine) — front landmarks for assessing pelvic tilt</li>
<li><strong>PSIS</strong> (posterior superior iliac spine) — "dimples of Venus"</li>
<li><strong>Ischial tuberosities</strong> — "sitting bones" — basis of seated alignment</li>
<li><strong>Neutral pelvis:</strong> ASIS and pubic symphysis in the same vertical plane</li>
</ul>

<h3>The Shoulder Girdle</h3>
<p>The shoulder complex includes four joints: <strong>glenohumeral (GH)</strong>, <strong>acromioclavicular (AC)</strong>, <strong>sternoclavicular (SC)</strong>, and <strong>scapulothoracic</strong>. The scapula is controlled entirely by muscular activity — making scapular stability crucial and trainable through Pilates.</p>`
      },
      {
        id: "2-4",
        title: "Neutral vs. Imprint & Spinal Biomechanics",
        content: `<div class="section-image"><img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop" alt="Stretching and spine mobility" loading="lazy"><p class="image-caption">Neutral spine — the position of optimal load distribution and deep core engagement.</p></div>
<h2>Neutral Spine vs. Imprinted Spine</h2>

<h3>Neutral Spine</h3>
<p><strong>In simple terms:</strong> Your spine has three natural curves — like a gentle S-shape. Neutral spine is when you preserve all three. It's not ramrod straight and it's not flattened out. <strong>Think of it like:</strong> the suspension system on a car — the curves are there to absorb shock and distribute load evenly.</p>
<p><strong>Definition:</strong> The position preserving the three physiological curves. In supine, the ASIS (front hip bones) and pubic symphysis are in the same horizontal plane; a natural gap beneath the lumbar spine fits approximately two fingers.</p>
<p><strong>Biomechanical basis:</strong> Position of optimal load distribution. Deep core muscles (TVA, multifidus) are most effectively recruited in neutral.</p>
<p><strong>When to use:</strong> Postural re-education; most foundational work; exercises focused on deep core activation.</p>

<h3>Imprinted Spine</h3>
<p><strong>Definition:</strong> The lumbar spine is gently pressed into the mat, reducing the natural lordosis — a slight posterior pelvic tilt.</p>
<p><strong>When to use:</strong></p>
<ul>
<li>Beginners who cannot maintain neutral under load</li>
<li>Transitional learning tool when deep core is not yet strong enough</li>
<li>Specific flexion-based exercises (Roll Up, Rolling Like a Ball)</li>
<li>Clients with very pronounced lordosis</li>
</ul>

<h2>Spinal Biomechanics</h2>
<table>
<tr><th>Movement</th><th>Description</th><th>Produced By</th><th>Pilates Context</th></tr>
<tr><td><strong>Flexion</strong></td><td>Forward bending</td><td>Rectus abdominis, obliques</td><td>Roll-ups, Hundreds, Spine Stretch</td></tr>
<tr><td><strong>Extension</strong></td><td>Backward bending</td><td>Erector spinae, multifidus, gluteals</td><td>Swan, Back Extension series</td></tr>
<tr><td><strong>Lateral Flexion</strong></td><td>Side bending (~40° per side)</td><td>Ipsilateral erector spinae, obliques, QL</td><td>Mermaid, Side Bend</td></tr>
<tr><td><strong>Rotation</strong></td><td>Axial rotation</td><td>Obliques, multifidus, rotatores</td><td>Spine Twist, Saw, Corkscrew</td></tr>
</table>

<blockquote>The lumbar spine has minimal rotation capacity (~5° per side). True rotation in Pilates should originate from the thoracic spine. Forcing lumbar rotation is a common source of injury.</blockquote>`
      },
      {
        id: "2-5",
        title: "Open Chain vs. Closed Chain Exercises",
        content: `<h2>Open Chain vs. Closed Chain — What's the Difference?</h2>
<div class="section-image"><img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop" alt="Reformer footwork exercise" loading="lazy"><p class="image-caption">Reformer footwork is a classic closed chain exercise — feet fixed on the footbar while the body moves.</p></div>
<p>This is one of the most important concepts in exercise science, and it shows up constantly in Pilates.</p>

<h3>Closed Chain (Feet or Hands Are Fixed)</h3>
<p>Think of it this way: if your foot or hand is planted on something that doesn't move (like the floor, the footbar, or the platform), that's a <strong>closed chain</strong> exercise. Your body moves AROUND the fixed point.</p>
<p><strong>Why it matters:</strong> Closed chain exercises recruit more muscles at once — your joints work as a team. They're generally safer for rehab because the joint is more stable.</p>

<div class="exercise-card"><h4>Closed Chain Examples in Pilates</h4>
<table>
<tr><th>Exercise</th><th>What's Fixed</th><th>What This Looks Like</th></tr>
<tr><td><strong>Footwork on Reformer</strong></td><td>Feet on footbar</td><td>You push the carriage away by pressing through your feet — your legs straighten while your feet stay put</td></tr>
<tr><td><strong>Plank / Long Stretch</strong></td><td>Hands on footbar</td><td>Your hands are anchored while your whole body moves as one unit</td></tr>
<tr><td><strong>Squats / Standing Lunges</strong></td><td>Feet on floor/platform</td><td>Feet planted, body lowers and lifts</td></tr>
<tr><td><strong>Elephant</strong></td><td>Hands on footbar, feet on carriage</td><td>Both ends are fixed — you push and pull using your core and hamstrings</td></tr>
<tr><td><strong>Push-Ups on Mat</strong></td><td>Hands on mat</td><td>Hands stay, body moves up and down</td></tr>
</table></div>

<div class="exercise-card"><h4>Open Chain Examples in Pilates</h4>
<p><strong>Open chain</strong> = the hand or foot moves freely in space. Nothing is pinning it down.</p>
<table>
<tr><th>Exercise</th><th>What Moves Freely</th><th>What This Looks Like</th></tr>
<tr><td><strong>Feet in Straps (Frogs, Circles)</strong></td><td>Feet</td><td>Your feet are in the loops and your legs move freely through space</td></tr>
<tr><td><strong>Leg Kicks (Single/Double)</strong></td><td>Feet/lower legs</td><td>Lying prone, your lower leg swings freely</td></tr>
<tr><td><strong>Arm Work in Straps</strong></td><td>Hands</td><td>Hands hold the straps and move freely against spring resistance</td></tr>
<tr><td><strong>Side Kick Series on Mat</strong></td><td>Top leg</td><td>Top leg swings forward and back with nothing anchoring it</td></tr>
<tr><td><strong>Rowing Series</strong></td><td>Hands</td><td>Seated, pulling straps — hands move freely through space</td></tr>
</table></div>

<h3>When to Use Each</h3>
<div class="exercise-card"><h4>Quick Decision Guide</h4>
<table>
<tr><th>Scenario</th><th>Best Choice</th><th>Why</th></tr>
<tr><td>Post-injury / early rehab</td><td>Closed chain first</td><td>More joint stability, more muscles helping out</td></tr>
<tr><td>Building functional strength</td><td>Mix of both</td><td>Real life uses both — walking is open chain, squatting is closed chain</td></tr>
<tr><td>Isolating a specific muscle</td><td>Open chain</td><td>Less compensation from surrounding muscles</td></tr>
<tr><td>Training balance & coordination</td><td>Closed chain</td><td>Forces the whole kinetic chain to work together</td></tr>
<tr><td>Prenatal clients</td><td>Mostly closed chain</td><td>More stable, less pelvic floor stress</td></tr>
</table></div>

<h3>A Simple Way to Remember</h3>
<p><strong>Closed chain</strong> = your body moves, the contact point stays still (like doing a squat — your feet don't go anywhere)<br>
<strong>Open chain</strong> = the contact point moves, your body stays still (like kicking a ball — your foot swings through the air)</p>
<p>Most Pilates classes naturally blend both. A good instructor sequences intentionally — for example, starting with closed-chain footwork to warm up the legs, then moving to open-chain feet-in-straps to challenge hip mobility and control.</p>`
      },
      {
        id: "2-6",
        title: "Hip Mechanics & Scapulohumeral Rhythm",
        content: `<h2>Hip Mechanics</h2>
<p>The hip is a ball-and-socket joint with the greatest ROM in the lower extremity.</p>

<table>
<tr><th>Movement</th><th>Range</th><th>Primary Muscles</th></tr>
<tr><td>Flexion</td><td>120–135° (knee bent)</td><td>Iliopsoas, rectus femoris</td></tr>
<tr><td>Extension</td><td>10–30°</td><td>Gluteus maximus, hamstrings</td></tr>
<tr><td>Abduction</td><td>45–50°</td><td>Gluteus medius, minimus, TFL</td></tr>
<tr><td>Adduction</td><td>20–30°</td><td>Adductors</td></tr>
<tr><td>External Rotation</td><td>45°</td><td>Deep six rotators, glute max</td></tr>
<tr><td>Internal Rotation</td><td>35–45°</td><td>Anterior glute medius, TFL</td></tr>
</table>

<h3>Lumbopelvic Rhythm</h3>
<p>Hip and lumbar spine movement are intimately linked. Limited hip flexion leads to compensatory lumbar flexion. Teaching clients to differentiate hip from lumbar movement is a foundational Pilates skill.</p>

<h2>Scapulohumeral Rhythm</h2>
<p><strong>In simple terms:</strong> When you lift your arm, your shoulder blade (scapula) and upper arm bone (humerus) move together in a coordinated dance. If this coordination breaks down, you get impingement, rotator cuff problems, and pain. <strong>Think of it like:</strong> two gears that must mesh perfectly to work without grinding.</p>
<p>The technical detail: for <strong>every 3° of shoulder elevation</strong>:</p>
<ul>
<li><strong>2°</strong> occur at the glenohumeral (GH) joint</li>
<li><strong>1°</strong> occurs at the scapulothoracic (ST) articulation</li>
</ul>
<p>This <strong>2:1 ratio</strong> ensures the subacromial space is maintained, preventing impingement.</p>

<h3>Force Couples for Scapulohumeral Rhythm</h3>
<table>
<tr><th>Force Couple</th><th>Components</th><th>Role</th></tr>
<tr><td>Deltoid + Rotator Cuff</td><td>Deltoid elevates; RC depresses/compresses</td><td>Maintains humeral head centration</td></tr>
<tr><td>Upper Trap + Lower Trap + Serratus Anterior</td><td>Three-way coordination</td><td>Produces upward scapular rotation</td></tr>
</table>`
      },
      {
        id: "2-7",
        title: "Kinetic Chain & Force Couples",
        content: `<h2>Kinetic Chain Concepts</h2>
<p><strong>In simple terms:</strong> your body is not a collection of separate parts — it's a chain. What happens at your foot affects your knee, which affects your hip, which affects your back. The <strong>kinetic chain</strong> is the interconnected system of joints, muscles, fascia, and neural pathways through which force is generated and transmitted. <strong>Think of it like:</strong> a row of dominoes — push one, and the effect ripples through the whole system.</p>

<h3>Open vs. Closed Kinetic Chain</h3>
<table>
<tr><th>Type</th><th>Definition</th><th>Example</th><th>Characteristics</th></tr>
<tr><td><strong>Open (OKC)</strong></td><td>Distal segment moves freely</td><td>Leg raises, arm circles</td><td>Greater ROM; more targeted activation</td></tr>
<tr><td><strong>Closed (CKC)</strong></td><td>Distal segment is fixed</td><td>Reformer footwork, push-up</td><td>More co-contraction; more functional</td></tr>
</table>

<h3>Kinetic Chain Breakdown Examples</h3>
<ul>
<li>Foot pronation → tibial internal rotation → knee valgus → hip internal rotation → anterior pelvic tilt</li>
<li>Weak hip abductors → contralateral pelvic drop → lumbar lateral flexion</li>
<li>Poor scapular stability → rotator cuff impingement</li>
</ul>

<h2>Force Couples</h2>
<p>A <strong>force couple</strong> is a pair of forces acting in opposite directions on the same structure to produce rotation without translation.</p>

<table>
<tr><th>Force Couple</th><th>Components</th><th>Pilates Relevance</th></tr>
<tr><td>Anterior pelvic tilt</td><td>Hip flexors + spinal extensors</td><td>Overactive iliopsoas; neutral training</td></tr>
<tr><td>Posterior pelvic tilt</td><td>Abdominals + hip extensors</td><td>Imprint position</td></tr>
<tr><td>Scapular upward rotation</td><td>Upper/lower trapezius + serratus anterior</td><td>Arm work, overhead movements</td></tr>
<tr><td>Spinal rotation</td><td>External oblique (one side) + internal oblique (opposite)</td><td>Spine Twist, Corkscrew</td></tr>
</table>

<h2>Joint Stability vs. Mobility</h2>
<p>The <strong>Joint-by-Joint Concept</strong> (Gray Cook / Mike Boyle):</p>
<table>
<tr><th>Joint</th><th>Primary Need</th><th>Dysfunction Leads To</th></tr>
<tr><td>Foot/Ankle</td><td>Mobility</td><td>Knee pain</td></tr>
<tr><td>Knee</td><td>Stability</td><td>Patellofemoral pain</td></tr>
<tr><td>Hip</td><td>Mobility</td><td>Low back pain</td></tr>
<tr><td>Lumbar Spine</td><td>Stability</td><td>Disc herniation</td></tr>
<tr><td>Thoracic Spine</td><td>Mobility</td><td>Shoulder impingement</td></tr>
<tr><td>Scapulothoracic</td><td>Stability</td><td>Rotator cuff dysfunction</td></tr>
</table>`
      },
      {
        id: "2-8",
        title: "Breathing Mechanics & Fascia",
        content: `<h2>Breathing Mechanics and Core Activation</h2>

<h3>Pilates Lateral Breathing</h3>
<p><strong>Think of your ribcage like an accordion that expands sideways.</strong> You breathe wide into your sides and back while keeping your belly gently pulled in. This is called <em>lateral thoracic breathing</em> — it lets you take full, deep breaths without losing your core connection. Pilates uses this approach because:</p>
<ul>
<li>Allows the diaphragm to descend and rise without releasing the abdominal connection</li>
<li>Maintains IAP and spinal support throughout movement</li>
<li>Trains the diaphragm as part of the core team</li>
</ul>

<h3>Breath Coordination in Exercise</h3>
<ul>
<li><strong>Exhale on exertion:</strong> The diaphragm rises, pelvic floor lifts, TVA draws in — maximizing core support</li>
<li><strong>Inhale to prepare:</strong> Typically on the preparation or lengthening phase</li>
</ul>

<h2>Fascia and Its Role in Movement</h2>
<p><strong>Fascia</strong> is dense fibrous connective tissue that surrounds, connects, and penetrates every structure in the body — a continuous three-dimensional web.</p>

<h3>Functions of Fascia</h3>
<ol>
<li><strong>Force transmission</strong> — distributes stress across the body</li>
<li><strong>Proprioception</strong> — contains mechanoreceptors</li>
<li><strong>Support and form</strong></li>
<li><strong>Healing and repair</strong></li>
<li><strong>Fluid dynamics</strong></li>
</ol>

<h3>Key Myofascial Lines (Tom Myers — "Anatomy Trains")</h3>
<ul>
<li><strong>Superficial Back Line:</strong> Plantar fascia → calcaneus → gastrocnemius → hamstrings → erector spinae → epicranial fascia</li>
<li><strong>Deep Front Line:</strong> Plantar foot → iliopsoas → diaphragm — the deepest stabilizing line, directly relevant to core work</li>
<li><strong>Lateral Line:</strong> Fibularis muscles → IT band → lateral abdominals → lateral neck</li>
<li><strong>Spiral Line:</strong> Creates a helix around the body; relevant in rotation exercises</li>
</ul>

<p>The slow, controlled, multi-directional nature of Pilates promotes fascial hydration, release of restrictions, and restoration of healthy movement patterns.</p>`
      },
      {
        id: "2-quiz",
        title: "Module 2 Quiz",
        isQuiz: true
      }
    ],
    quiz: generateModule2Quiz()
  },

  // ========== MODULE 3 ==========
  {
    id: 3,
    title: "Mat Pilates Certification",
    week: "Weeks 3–5",
    description: "Master all 34 Return to Life exercises, classical mat sequencing, levels, and comprehensive prop work including Magic Circle, Overball, and more.",
    icon: "fa-person-praying",
    sections: [
      {
        id: "3-1",
        title: "The 34 Mat Exercises (Part 1: Exercises 1–17)",
        content: generateMatExercisesContent1()
      },
      {
        id: "3-2",
        title: "The 34 Mat Exercises (Part 2: Exercises 18–34)",
        content: generateMatExercisesContent2()
      },
      {
        id: "3-3",
        title: "Classical Mat Levels & Sculpt Integration",
        content: `<h2>Classical Mat Levels Reference</h2>
<table>
<tr><th>Level</th><th>Exercises</th></tr>
<tr><td><strong>Basic</strong></td><td>Hundred, Roll Up, Single Leg Circles, Rolling Like a Ball, Single Leg Stretch, Double Leg Stretch, Spine Stretch Forward</td></tr>
<tr><td><strong>Intermediate</strong></td><td>Adds: Single Straight Leg, Double Straight Leg, Criss Cross, Open Leg Rocker, Corkscrew, Saw, Neck Roll, Single/Double Leg Kicks, Neck Pull, Side Kick Series, Teaser 1, Seal</td></tr>
<tr><td><strong>Advanced</strong></td><td>Full repertoire: adds Rollover, High Scissors, High Bicycle, Shoulder Bridge w/ kicks, Jackknife, Teasers 2 & 3, Hip Circles, Leg Pull Front/Back, Kneeling Side Kicks, Mermaid, Side Bend, Boomerang, Crab, Rocking, Control Balance, Push Up</td></tr>
</table>

<h2>Sculpt Pilates Integration</h2>
<p>"Pilates Sculpt" blends the foundational principles of Pilates with <strong>external resistance and strength-training elements</strong> to increase muscle activation and metabolic output.</p>

<h3>How Sculpt Integrates with Traditional Mat</h3>
<table>
<tr><th>Traditional Exercise</th><th>Sculpt Modification</th></tr>
<tr><td>Hundred</td><td>Add light ankle weights for leg resistance</td></tr>
<tr><td>Roll Up</td><td>Hold a weight or magic circle between palms</td></tr>
<tr><td>Side Kick Series</td><td>Add ankle weights for hip strengthening</td></tr>
<tr><td>Swimming</td><td>Light wrist weights for posterior chain loading</td></tr>
<tr><td>Bridge</td><td>Dumbbell on hips; magic circle between thighs</td></tr>
</table>

<h3>Key Principles in Sculpt Classes</h3>
<ul>
<li><strong>Breath</strong> cued on exertion (exhale on effort)</li>
<li><strong>Neutral spine / imprint</strong> maintained in all ground-based work</li>
<li><strong>Scapular stability</strong> during all upper body work</li>
<li><strong>Core connection</strong> before limb movement</li>
<li><strong>Alignment</strong> (ribcage over pelvis; knees tracking over toes)</li>
</ul>`
      },
      {
        id: "3-4",
        title: "Props: Magic Circle (23 Exercises)",
        content: generateMagicCircleContent()
      },
      {
        id: "3-5",
        title: "Props: Overball / Squishy Ball (21 Exercises)",
        content: generateOverballContent()
      },
      {
        id: "3-6",
        title: "Props: Stability Ball, Bands & More",
        content: `<h2>Stability Ball Exercises</h2>
<p>The stability ball (Swiss ball, 55–75 cm) challenges balance and core stabilization through instability.</p>

<div class="exercise-card"><h4>Ball Bridging</h4>
<p>Supine with feet on ball. Peel spine up to bridge. The unstable surface recruits deep stabilizers. Progress: single leg, marching.</p></div>

<div class="exercise-card"><h4>Ball Plank</h4>
<p>Forearms or hands on ball in plank position. Instability demands constant core engagement and scapular control.</p></div>

<div class="exercise-card"><h4>Ball Pike</h4>
<p>Plank with shins on ball. Pike hips up drawing ball toward hands. Demands significant core and hip flexor strength.</p></div>

<div class="exercise-card"><h4>Ball Back Extension</h4>
<p>Prone draped over ball, feet against wall. Extend spine lifting chest. Excellent for spinal extensors.</p></div>

<div class="exercise-card"><h4>Ball Side-Lying Leg Series</h4>
<p>Side-lying with ball between ankles. Perform lifts, circles, pulses. Added instability recruits deeper hip stabilizers.</p></div>

<h2>Resistance Band Exercises</h2>
<p>Resistance bands add progressive resistance to classical exercises while maintaining Pilates alignment principles.</p>

<div class="exercise-card"><h4>Band Footwork</h4><p>Seated, band around feet. Press out as in reformer footwork. Excellent for home practice simulating reformer resistance.</p></div>
<div class="exercise-card"><h4>Band Rowing</h4><p>Seated, band around feet. Pull back in rowing motion. Strengthens posterior chain with scapular retraction focus.</p></div>
<div class="exercise-card"><h4>Band Arm Series</h4><p>Standing or kneeling, band under feet or secured. Perform bicep curls, lateral raises, chest press maintaining Pilates alignment.</p></div>
<div class="exercise-card"><h4>Band Side-Lying</h4><p>Band looped around thighs. Side-lying clamshells and abduction series with added resistance for glute medius.</p></div>

<h2>Light Weights Integration</h2>
<p>1–3 lb weights held during mat work increase upper body engagement while maintaining form focus.</p>

<h2>Dowel Exercises</h2>
<p>A light wooden dowel provides feedback for alignment and adds lever-arm challenge.</p>
<div class="exercise-card"><h4>Dowel Roll-Down</h4><p>Hold dowel across shoulders. Roll down through spine with dowel providing alignment feedback.</p></div>
<div class="exercise-card"><h4>Dowel Rotation</h4><p>Seated with dowel across shoulders. Rotate torso. Dowel shows rotation range visually.</p></div>`
      },
      {
        id: "3-quiz",
        title: "Module 3 Quiz",
        isQuiz: true
      }
    ],
    quiz: generateModule3Quiz()
  },

  // ========== MODULE 4 ==========
  {
    id: 4,
    title: "Reformer Pilates Certification",
    week: "Weeks 5–8",
    description: "Master the classical reformer repertoire — anatomy, springs, safety, complete exercises organized by position, plus three example class flows.",
    icon: "fa-dumbbell",
    sections: [
      {
        id: "4-1",
        title: "Reformer Anatomy, Safety & History",
        content: generateReformerAnatomyContent()
      },
      {
        id: "4-2",
        title: "Reformer Level 1 — Foundation",
        content: generateReformerLevel1Content()
      },
      {
        id: "4-3",
        title: "Reformer 1.5 — Intermediate",
        content: generateReformerLevel15Content()
      },
      {
        id: "4-4",
        title: "Advanced Reformer 2.0",
        content: generateReformerLevel2Content()
      },
      {
        id: "4-5",
        title: "Jumpboard",
        content: generateReformerJumpboardContent()
      },
      {
        id: "4-6",
        title: "Three Example Class Flows",
        content: generateClassFlowsContent()
      },
      {
        id: "4-quiz",
        title: "Module 4 Quiz",
        isQuiz: true
      }
    ],
    quiz: generateModule4Quiz()
  },

  // ========== MODULE 5 ==========
  {
    id: 5,
    title: "The Art of Cueing",
    week: "Week 9",
    description: "Develop the sophisticated skill of effective cueing — verbal, visual, tactile, and sensory — to shape your clients' movement experience.",
    icon: "fa-comments",
    sections: [
      {
        id: "5-1",
        title: "Types of Cues",
        content: `<div class="section-image"><img src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&h=400&fit=crop" alt="Pilates instruction" loading="lazy"><p class="image-caption">Effective cueing is the bridge between knowing the exercise and helping your client feel it.</p></div>
<h2>The Four Types of Cues</h2>

<h3>Verbal Cues</h3>
<p>Spoken language — the most versatile cueing tool. Verbal cues include:</p>
<ul>
<li><strong>Directional/Positional:</strong> "Bring your heels toward your sit bones"</li>
<li><strong>Anatomical:</strong> "Draw your lower ribs toward your hip bones"</li>
<li><strong>Imagery-Based:</strong> "Imagine a string attached to the crown of your head, gently lengthening you upward"</li>
<li><strong>Sensory:</strong> "Feel the back of your rib cage widen into your mat"</li>
</ul>
<p><strong>Action words:</strong> Float, glide, lengthen, melt, press, reach, suspend, scoop, wrap, zip, pour, carve, unfurl.</p>

<h3>Visual Cues</h3>
<p>Demonstrate the exercise with precision. Do not demonstrate while talking extensively — visual learners need to <em>look</em>, not listen simultaneously. Show the modification as well as the full expression.</p>

<h3>Tactile Cues</h3>
<p>Hands-on physical guidance — the most powerful and precise cueing type, requiring training, consent, and sensitivity.</p>
<ul>
<li><strong>Feedback:</strong> "Feel how your shoulder drops away when I place my hand here"</li>
<li><strong>Resistance:</strong> "Press into my hand as you exhale"</li>
<li><strong>Support:</strong> Guiding a movement the body has not yet found</li>
<li><strong>Awareness:</strong> Drawing attention through light contact</li>
<li><strong>Facilitation:</strong> A light tap on an inhibited muscle</li>
</ul>
<p><strong>Always obtain consent</strong> before touching. Use flat-palmed, confident contact — never tentative.</p>

<h3>Sensory Cues</h3>
<p>Describing what the client should <em>feel</em>:</p>
<ul>
<li>"Notice if one side of your waist feels longer than the other"</li>
<li>"Feel your shoulder blades melt down your back"</li>
</ul>`
      },
      {
        id: "5-2",
        title: "Internal vs. External Focus",
        content: `<h2>Internal vs. External Focus of Attention</h2>
<p>Research by <strong>Wulf and Prinz (2001)</strong> established the Constrained Action Hypothesis:</p>

<table>
<tr><th>Focus Type</th><th>Definition</th><th>Example</th></tr>
<tr><td><strong>External (EFA)</strong></td><td>Attention to the effect or environment</td><td>"Press your feet into the footbar"</td></tr>
<tr><td><strong>Internal (IFA)</strong></td><td>Attention to body mechanics</td><td>"Activate your glutes"</td></tr>
</table>

<blockquote>External focus of attention consistently <strong>improves movement performance and learning</strong> compared to internal focus, especially in early stages. When clients focus internally, they tend to over-contract and move stiffly.</blockquote>

<h3>Practical Application</h3>
<ul>
<li>Use <strong>external cues</strong> to initiate movement and establish flow: "grow tall to the ceiling"</li>
<li>Introduce <strong>internal cues</strong> selectively for refinement: "can you feel your deep low belly drawing in?"</li>
<li>Avoid defaulting to internal focus for entire sessions</li>
</ul>

<h3>Comparison Table</h3>
<table>
<tr><th>Cue Type</th><th>Best For</th><th>Example</th></tr>
<tr><td>Imagery</td><td>New movers; quality of movement</td><td>"Float your arms like wings"</td></tr>
<tr><td>Directional</td><td>Establishing spatial orientation</td><td>"Reach your arms to the ceiling"</td></tr>
<tr><td>Anatomical</td><td>Advanced clients; clinical settings</td><td>"Engage your serratus anterior"</td></tr>
<tr><td>Sensory</td><td>Building proprioception; fine-tuning</td><td>"Feel the inner heel pressing"</td></tr>
</table>`
      },
      {
        id: "5-3",
        title: "Cueing Layering Hierarchy",
        content: `<h2>How to Layer Cues Effectively</h2>
<p>Layering is the art of progressively building information — starting broad and adding refinement only as each layer is integrated.</p>

<h3>The 5-Level Layering Hierarchy</h3>

<div class="exercise-card"><h4>Layer 1 — The Overall Shape/Direction</h4>
<p>"Lie on your back, knees bent, feet flat." Get the client positioned.</p></div>

<div class="exercise-card"><h4>Layer 2 — Core Connection</h4>
<p>"On your next exhale, feel your deep belly draw in and your pelvic floor gently lift." Establish foundation.</p></div>

<div class="exercise-card"><h4>Layer 3 — Movement Initiation</h4>
<p>"Inhale to prepare; exhale, press your feet and float your hips up." Introduce the movement.</p></div>

<div class="exercise-card"><h4>Layer 4 — Refinement</h4>
<p>"As you hold the bridge, feel the space behind your knees softening — not gripping." Refine quality.</p></div>

<div class="exercise-card"><h4>Layer 5 — Integration</h4>
<p>"Now add the arm reach — feel the connection from your fingers through your spine to your heels." Global integration.</p></div>

<blockquote><strong>Critical principle:</strong> Only add the next layer when the previous one is established. Teaching everything at once produces confusion, not learning.</blockquote>

<p><strong>Silence is a cueing tool:</strong> Once movement is flowing, stop talking. Allow the client to feel and self-regulate. Constant verbal input interrupts proprioceptive learning.</p>`
      },
      {
        id: "5-4",
        title: "Common Mistakes & Voice Modulation",
        content: `<h2>Common Cueing Mistakes</h2>
<table>
<tr><th>Mistake</th><th>Why It Happens</th><th>Fix</th></tr>
<tr><td>Over-cueing the setup</td><td>Fear exercise will go wrong</td><td>Set up briefly; correct during movement</td></tr>
<tr><td>Giving all cues before movement</td><td>"Paralysis by analysis"</td><td>Give essential position, then move; add detail during reps</td></tr>
<tr><td>Repeating the same cue</td><td>Habitual; fear of silence</td><td>Observe first; try a different cue type</td></tr>
<tr><td>Not watching the individual</td><td>Trained scripts</td><td>Observe every client on every rep</td></tr>
<tr><td>Same imagery for everyone</td><td>Reliance on go-to cues</td><td>Build a repertoire; ask what resonates</td></tr>
<tr><td>Not allowing mistakes</td><td>Desire to be helpful</td><td>Strategic non-intervention is a skill</td></tr>
<tr><td>Using negative cues</td><td>Describing what NOT to do</td><td>Reframe: "Let your shoulders melt" instead of "Don't shrug"</td></tr>
</table>

<h2>Voice Modulation and Pacing</h2>
<ul>
<li><strong>Tempo:</strong> Match your verbal tempo to the movement speed</li>
<li><strong>Volume:</strong> Lower voice to draw attention inward; increase to energize</li>
<li><strong>Pitch:</strong> Naturally lower pitch = authority and grounding</li>
<li><strong>Pausing:</strong> Strategic pauses give clients time to process — active learning time</li>
<li><strong>Tone:</strong> Match the client's nervous system state — calm for anxious clients, dynamic for group classes</li>
</ul>`
      },
      {
        id: "5-5",
        title: "Cueing for Learning Styles & Exercise Examples",
        content: `<h2>Cueing for Different Learning Styles</h2>
<table>
<tr><th>Style</th><th>Preferred Input</th><th>Strategy</th></tr>
<tr><td><strong>Visual</strong></td><td>Watching; spatial awareness</td><td>Demonstrate before they attempt; use mirror</td></tr>
<tr><td><strong>Auditory</strong></td><td>Listening; verbal explanation</td><td>Clear, well-paced verbal description</td></tr>
<tr><td><strong>Kinaesthetic</strong></td><td>Feeling; sensation; doing</td><td>Tactile cues; get them moving quickly</td></tr>
<tr><td><strong>Analytical</strong></td><td>Understanding the 'why'</td><td>Biomechanical explanation; brief education</td></tr>
<tr><td><strong>Global/Intuitive</strong></td><td>Big picture; flow</td><td>Imagery; fewer details; broad overview</td></tr>
</table>

<h2>Effective Cues for Major Exercises</h2>
<table>
<tr><th>Exercise</th><th>Common Error</th><th>Effective Cue</th></tr>
<tr><td><strong>Hundreds</strong></td><td>Neck strain; shoulder hiking</td><td>"Nod your chin as if holding a peach under your chin"; "Heavy shoulder blades sinking into the mat"</td></tr>
<tr><td><strong>Roll-Up</strong></td><td>Momentum; no segmentation</td><td>"Peel yourself off the mat one vertebra at a time — imagine each bone is a button being unhooked"</td></tr>
<tr><td><strong>Single Leg Circle</strong></td><td>Hip hiking; pelvis rocking</td><td>"Your pelvis is anchored — only the leg moves"; "Hip socket as a still lake"</td></tr>
<tr><td><strong>Swan</strong></td><td>Lower back compression</td><td>"Lead with your sternum, not your chin"; "Thoracic spine unfurling like a frond"</td></tr>
<tr><td><strong>Bridging</strong></td><td>Hamstring cramping</td><td>"Think about dragging your heels toward your sit bones"; "Reach knees away from hips"</td></tr>
<tr><td><strong>Footwork (Reformer)</strong></td><td>Knee tracking</td><td>"Three points of your foot — big toe, little toe, heel — press all equally"</td></tr>
<tr><td><strong>Teaser</strong></td><td>Hip flexor dominance</td><td>"Find your deep scoop — feel the low belly hollow before you lift"</td></tr>
<tr><td><strong>Plank</strong></td><td>Shoulder shrugging; lumbar sag</td><td>"Widen your collarbones; press the floor away from you"</td></tr>
</table>`
      },
      {
        id: "5-quiz",
        title: "Module 5 Quiz",
        isQuiz: true
      }
    ],
    quiz: generateModule5Quiz()
  },

  // ========== MODULE 6 ==========
  {
    id: 6,
    title: "Special Populations",
    week: "Weeks 10–11",
    description: "Learn to safely modify Pilates for prenatal, postnatal, osteoporosis, and injury clients — with evidence-based guidelines and scope of practice.",
    icon: "fa-heart-pulse",
    sections: [
      {
        id: "6-1",
        title: "Prenatal Pilates",
        content: `<div class="section-image"><img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop" alt="Gentle movement and stretching" loading="lazy"><p class="image-caption">Pilates adapts beautifully to support the body through pregnancy — with the right modifications at each stage.</p></div>
<h2>Prenatal Pilates — Trimester-by-Trimester Guidelines</h2>

<h3>Key Physiological Changes in Pregnancy</h3>
<ul>
<li><strong>Relaxin:</strong> Released from week 6, increases ligament laxity throughout the body</li>
<li><strong>Cardiovascular:</strong> Blood volume increases 45–50%; avoid supine position after 20 weeks</li>
<li><strong>Center of gravity shift:</strong> Growing uterus shifts COG anteriorly, increasing lumbar lordosis</li>
<li><strong>Diastasis recti:</strong> 66–100% of women have some degree in third trimester — a normal process</li>
</ul>

<h3>First Trimester (Weeks 1–12)</h3>
<ul>
<li>Most standard exercises can be performed</li>
<li>Avoid advancing difficulty; maintain, don't push</li>
<li>Begin pelvic floor awareness training</li>
<li>Avoid overheating; stay hydrated</li>
<li>No breath-holding (Valsalva)</li>
</ul>

<h3>Second Trimester (Weeks 13–26)</h3>
<ul>
<li><strong>Avoid lying flat on back</strong> (from ~16–20 weeks) — vena cava compression</li>
<li><strong>Modify prone positions</strong> — use all-fours, side-lying, standing</li>
<li><strong>Avoid full planks</strong> — abdominal coning/doming</li>
<li><strong>Avoid crunches, Hundreds, Roll-Ups</strong> — excessive IAP; DR risk</li>
<li>Focus on side-lying, seated, standing, and quadruped positions</li>
</ul>

<h3>Third Trimester (Weeks 27–40)</h3>
<ul>
<li>Fully avoid supine — semi-reclined or side-lying only</li>
<li>Introduce <strong>reverse Kegels</strong> — pelvic floor relaxation for birth preparation</li>
<li>Reduce exercise volume and intensity</li>
<li>Wide squats (supported) are excellent labour preparation</li>
</ul>

<h3>Contraindicated Exercises</h3>
<table>
<tr><th>Exercise</th><th>Why Avoid</th><th>Modification</th></tr>
<tr><td>Hundred, Crunches, Roll-Ups</td><td>Excessive IAP; DR risk</td><td>Diaphragmatic breathing, pelvic tilts</td></tr>
<tr><td>Supine flat-back (after 20 wks)</td><td>Vena cava compression</td><td>Semi-inclined, side-lying</td></tr>
<tr><td>Full Planks</td><td>Abdominal coning</td><td>Incline plank, kneeling plank</td></tr>
<tr><td>Deep twists</td><td>Uterine/abdominal pressure</td><td>Gentle seated upper back rotation</td></tr>
<tr><td>Prone exercises</td><td>Direct pressure on uterus</td><td>All-fours, standing</td></tr>
</table>`
      },
      {
        id: "6-2",
        title: "Postnatal Pilates",
        content: `<h2>Postnatal Pilates — Return Timeline</h2>

<h3>Timeline</h3>
<table>
<tr><th>Period</th><th>Focus</th></tr>
<tr><td><strong>Weeks 0–2</strong></td><td>Rest, gentle walking, diaphragmatic breathing, pelvic floor awareness</td></tr>
<tr><td><strong>Weeks 2–6</strong></td><td>Gentle pelvic floor activation, deep core breathing, postural awareness</td></tr>
<tr><td><strong>Week 6+ (after clearance)</strong></td><td>Modified mat Pilates, foundational movements</td></tr>
<tr><td><strong>Months 2–4</strong></td><td>Progressive loading: bridges, modified dead bugs, reformer intro</td></tr>
<tr><td><strong>Month 4+</strong></td><td>Return to full repertoire only when pelvic floor is symptom-free</td></tr>
</table>

<h3>The 4R Approach</h3>
<ol>
<li><strong>Relax:</strong> Reduce muscle tension; restore resting tone</li>
<li><strong>Release:</strong> Pelvic floor lengthening; abdominal roll-downs</li>
<li><strong>Realign:</strong> Re-establish neutral spine; address rib flare</li>
<li><strong>Restore:</strong> Progressive dynamic exercise</li>
</ol>

<h3>Diastasis Recti Assessment</h3>
<p>Supine, knees bent; lift head slightly; palpate midline with 2–3 fingers. Measure width AND tension. A narrow, tense linea alba with functional stability is more important than width alone.</p>

<h3>C-Section Recovery</h3>
<p>A C-section cuts through <strong>7 layers of tissue</strong>. Specific considerations:</p>
<ul>
<li>Scar massage from 6 weeks once wound is fully closed</li>
<li>TVA activation may feel different due to incision site</li>
<li>Formal Pilates: typically 8–12 weeks post-surgery</li>
<li>Full repertoire: 3–6 months+</li>
</ul>`
      },
      {
        id: "6-3",
        title: "Osteoporosis",
        content: `<h2>Osteoporosis & Pilates</h2>
<p>Osteoporosis is characterized by reduced bone mineral density (T-score ≤ -2.5 on DEXA scan). Primary fracture risk sites: vertebral bodies, hip, wrist.</p>

<h3>Contraindicated Movements</h3>
<table>
<tr><th>Movement</th><th>Risk</th><th>Exercises to Avoid</th></tr>
<tr><td><strong>Loaded spinal flexion</strong></td><td>Vertebral compression fracture</td><td>Crunches, Roll-Up, Hundreds, Spine Stretch</td></tr>
<tr><td><strong>Flexion + rotation</strong></td><td>Compounded vertebral stress</td><td>Saw, Corkscrew</td></tr>
<tr><td><strong>Uncontrolled flexion</strong></td><td>Fracture from ballistic loading</td><td>Rolling Like a Ball, Roll-Over</td></tr>
<tr><td><strong>High-impact movements</strong></td><td>Fracture via impact force</td><td>Jump board</td></tr>
</table>

<p><strong>Key principle:</strong> Forward bends should involve <strong>hip flexion only</strong> — not spinal flexion. Cue "hinge from the hips with a long spine."</p>

<h3>Safe Exercises</h3>
<table>
<tr><th>Category</th><th>Exercises</th></tr>
<tr><td>Core stabilization</td><td>Pelvic tilts, clam, side-lying hip abduction, bridging</td></tr>
<tr><td>Spinal extension</td><td>Swan prep, thoracic extension, modified swimming</td></tr>
<tr><td>Standing work</td><td>Standing footwork, plié, standing balance</td></tr>
<tr><td>Balance</td><td>Single-leg standing, tandem stance</td></tr>
</table>

<p>Pilates offers important <strong>secondary fracture risk reduction</strong>: improved balance, coordination, posture, and fall prevention.</p>`
      },
      {
        id: "6-4",
        title: "Working with Injuries",
        content: `<div class="section-image"><img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop" alt="Rehabilitation and movement" loading="lazy"><p class="image-caption">Understanding common injuries allows you to keep clients moving safely through the rehabilitation process.</p></div>
<h2>Working with Injuries & Common Conditions</h2>

<h3>Low Back Pain</h3>
<p>The leading cause of disability globally. Pilates is effective for chronic non-specific LBP.</p>
<ol>
<li><strong>Phase 1 — Reduce pain:</strong> Gentle breathing, TVA/multifidus retraining, pelvic tilts</li>
<li><strong>Phase 2 — Build stability:</strong> Dead bug, bridging, clam, side-lying series</li>
<li><strong>Phase 3 — Functional strength:</strong> Standing work, reformer progressions</li>
<li><strong>Phase 4 — Return to full repertoire</strong></li>
</ol>

<h3>Disc Herniations</h3>
<p>Most lumbar disc herniations are posterolateral. Extension-based exercises can often reduce symptoms. Avoid loaded spinal flexion in acute phase.</p>

<h3>Shoulder Injuries</h3>
<ul>
<li>Prioritize scapular stabilization: serratus anterior, lower/mid trapezius</li>
<li>Restore scapulohumeral rhythm</li>
<li>Rotator cuff strengthening in neutral</li>
<li>Thoracic extension to reduce impingement risk</li>
</ul>

<h3>Knee Injuries (ACL, Meniscus, PFPS)</h3>
<ul>
<li>Closed-chain exercises with minimal tibial rotation</li>
<li>VMO activation, hamstring and gluteal strengthening</li>
<li>Reformer footwork is excellent for rehabilitation</li>
</ul>

<h3>Hip Replacements</h3>
<p>Posterior/lateral approach precautions: avoid hip flexion past 90°, adduction past midline, internal rotation (for 6–12 weeks).</p>

<h3>Scoliosis</h3>
<p>Pilates significantly reduces Cobb angle and angle of trunk rotation. Goal: lengthen concave side, stabilize convex side. Asymmetric treatment approach.</p>

<h3>Hypermobility</h3>
<ul>
<li>Never cue to end range</li>
<li>Teach finding internal resistance — "stop 10% before maximum"</li>
<li>Build stability before mobility</li>
<li>Focus on strength, not flexibility</li>
</ul>`
      },
      {
        id: "6-5",
        title: "Scope of Practice",
        content: `<h2>Scope of Practice: When to Modify vs. Refer</h2>

<table>
<tr><th>Situation</th><th>Instructor Action</th></tr>
<tr><td>Client has diagnosis, medical clearance</td><td>Proceed with modifications; communicate with clinician</td></tr>
<tr><td>Client reports acute pain during session</td><td>Stop movement; assess; refer if persistent</td></tr>
<tr><td>Red flags present</td><td>Do not begin exercise; advise immediate medical review</td></tr>
<tr><td>Symptoms not improving despite modifications</td><td>Refer to physiotherapist</td></tr>
<tr><td>Client asks for diagnosis or medical advice</td><td>Decline clearly; refer to health professional</td></tr>
<tr><td>Signs of prolapse, incontinence</td><td>Refer to pelvic health physiotherapist</td></tr>
</table>

<h3>Within Scope</h3>
<ul>
<li>Providing safe, appropriate, evidence-informed Pilates exercise</li>
<li>Adapting exercises for known conditions</li>
<li>Observing and reporting movement dysfunction</li>
<li>Educating on Pilates principles and correct technique</li>
<li>Recognizing warning signs and referring</li>
</ul>

<h3>Outside Scope</h3>
<ul>
<li>Diagnosing medical conditions</li>
<li>Prescribing treatment</li>
<li>Providing clinical physiotherapy or medical advice</li>
<li>Performing manual therapy (unless additionally qualified)</li>
<li>Progressing post-surgical clients beyond medical clearance</li>
</ul>

<h3>Red Flags Requiring Immediate Medical Referral</h3>
<ul>
<li>Bowel/bladder incontinence or retention</li>
<li>Saddle anesthesia</li>
<li>Severe bilateral leg weakness</li>
<li>Fever with back pain</li>
<li>History of cancer with new back pain</li>
<li>Unexplained weight loss</li>
<li>Acute back pain after trauma</li>
</ul>`
      },
      {
        id: "6-quiz",
        title: "Module 6 Quiz",
        isQuiz: true
      }
    ],
    quiz: generateModule6Quiz()
  },

  // ========== MODULE 7 ==========
  {
    id: 7,
    title: "Ethics, Professionalism & NPCP Prep",
    week: "Week 12",
    description: "Prepare for professional practice — ethics, NPCP certification requirements, continuing education, and business fundamentals.",
    icon: "fa-award",
    sections: [
      {
        id: "7-1",
        title: "Scope of Practice for Pilates Instructors",
        content: `<h2>Scope of Practice for Pilates Instructors</h2>
<p>As a certified Pilates instructor, you operate within a defined scope that ensures client safety and professional integrity.</p>

<h3>You ARE qualified to:</h3>
<ul>
<li>Teach Pilates exercises using correct technique, alignment, and progression</li>
<li>Design exercise programs appropriate for your clients' fitness levels</li>
<li>Modify exercises for known conditions and limitations</li>
<li>Provide general wellness and fitness information</li>
<li>Observe movement patterns and suggest corrections</li>
<li>Refer clients to medical professionals when appropriate</li>
<li>Use props and apparatus within your certification level</li>
</ul>

<h3>You are NOT qualified to:</h3>
<ul>
<li>Diagnose medical conditions or injuries</li>
<li>Provide nutritional counseling (unless separately certified)</li>
<li>Perform manual therapy or physical therapy treatments</li>
<li>Prescribe specific exercises as medical treatment</li>
<li>Override a healthcare provider's restrictions</li>
<li>Work with high-risk populations without appropriate advanced training</li>
</ul>

<h3>Client Intake and Screening</h3>
<p>Every new client should complete:</p>
<ul>
<li>A health history questionnaire (PAR-Q+ or equivalent)</li>
<li>Informed consent and waiver</li>
<li>Movement assessment</li>
<li>Medical clearance for any conditions or recent surgeries</li>
</ul>`
      },
      {
        id: "7-2",
        title: "Professional Ethics & Conduct",
        content: `<h2>Professional Ethics & Conduct</h2>

<h3>Core Ethical Principles</h3>

<div class="exercise-card"><h4>Client Welfare First</h4>
<p>The client's safety and well-being always take priority over revenue, schedule, or personal achievement goals. Never push a client beyond safe limits.</p></div>

<div class="exercise-card"><h4>Informed Consent</h4>
<p>Clients must understand what they are agreeing to — from exercise risks to hands-on cueing. Consent must be ongoing, not just at intake.</p></div>

<div class="exercise-card"><h4>Professional Boundaries</h4>
<p>Maintain clear boundaries regarding personal relationships, communication, physical contact, and business dealings. Document sessions appropriately.</p></div>

<div class="exercise-card"><h4>Confidentiality</h4>
<p>Client health information, session notes, and personal details are private. Follow local privacy laws and best practices.</p></div>

<div class="exercise-card"><h4>Continued Competence</h4>
<p>Stay current with evidence-based practice. Complete required CECs. Recognize the limits of your knowledge.</p></div>

<div class="exercise-card"><h4>Inclusive Practice</h4>
<p>Welcome all body types, abilities, ages, and backgrounds. Avoid language that excludes or shames. Use body-neutral cueing.</p></div>

<h3>Social Media & Marketing Ethics</h3>
<ul>
<li>Do not make medical claims about Pilates</li>
<li>Do not share client information or images without written consent</li>
<li>Represent your qualifications accurately</li>
<li>Cite sources when sharing educational content</li>
</ul>`
      },
      {
        id: "7-3",
        title: "NPCP Certification Requirements",
        content: `<h2>NPCP Certification Requirements</h2>
<p>The <strong>National Pilates Certification Program (NPCP)</strong> — formerly PMA certification — is the recognized professional credential for Pilates instructors.</p>

<h3>Eligibility Requirements</h3>
<ul>
<li>Minimum <strong>450 hours</strong> of comprehensive Pilates teacher training from a qualified program</li>
<li>Training must include: Mat, Reformer, and at least two other apparatus (Cadillac, Chair, Barrels)</li>
<li>Must include: Anatomy, observation hours, practice teaching hours, student teaching</li>
<li>CPR/AED certification</li>
</ul>

<h3>The 450 Hours Breakdown (Typical)</h3>
<table>
<tr><th>Component</th><th>Hours</th></tr>
<tr><td>Course instruction (lectures, labs)</td><td>~200 hours</td></tr>
<tr><td>Observation hours</td><td>~100 hours</td></tr>
<tr><td>Practice teaching</td><td>~100 hours</td></tr>
<tr><td>Personal practice</td><td>~50 hours</td></tr>
</table>

<h3>NPCP Exam Format</h3>
<ul>
<li><strong>125 multiple-choice questions</strong></li>
<li><strong>2-hour time limit</strong></li>
<li>Minimum passing score: <strong>80%</strong></li>
<li>Computer-based testing at authorized centers</li>
</ul>

<h3>Exam Content Areas</h3>
<table>
<tr><th>Domain</th><th>Approximate Weight</th></tr>
<tr><td>Exercise Programming & Modifications</td><td>30%</td></tr>
<tr><td>Anatomy & Biomechanics</td><td>25%</td></tr>
<tr><td>Teaching & Cueing</td><td>20%</td></tr>
<tr><td>Professional Responsibilities</td><td>15%</td></tr>
<tr><td>Safety & Equipment</td><td>10%</td></tr>
</table>`
      },
      {
        id: "7-4",
        title: "Continuing Education & Business Basics",
        content: `<h2>Continuing Education Requirements</h2>
<p>NPCP certification must be renewed every <strong>2 years</strong>.</p>
<ul>
<li><strong>16 Continuing Education Credits (CECs)</strong> required per renewal cycle</li>
<li>At least <strong>10 CECs</strong> must be from NPCP-approved providers</li>
<li>Up to <strong>6 CECs</strong> from allied health courses (anatomy, physiology, etc.)</li>
<li>Maintain current CPR/AED certification</li>
</ul>

<h3>CEC Opportunities</h3>
<ul>
<li>Workshops and conferences (PMA/NPCP conferences)</li>
<li>Online courses from approved providers</li>
<li>Advanced certification programs (pre/postnatal, injuries)</li>
<li>Mentorship programs</li>
<li>Teaching at approved programs (limited credits)</li>
</ul>

<h2>Business Basics for Pilates Instructors</h2>

<h3>Career Paths</h3>
<ul>
<li><strong>Studio employment</strong> — most common starting path; steady clients, mentorship</li>
<li><strong>Independent contractor</strong> — teaching at multiple studios; more flexibility</li>
<li><strong>Private practice</strong> — in-home or rented space; highest earning potential</li>
<li><strong>Studio ownership</strong> — requires business acumen and significant investment</li>
</ul>

<h3>Building Your Practice</h3>
<ul>
<li>Develop a niche (prenatal, athletes, rehabilitation, etc.)</li>
<li>Build relationships with local healthcare providers for referrals</li>
<li>Invest in continued education regularly</li>
<li>Create a professional online presence</li>
<li>Collect testimonials (with consent)</li>
<li>Network within the Pilates community</li>
</ul>

<h3>Insurance</h3>
<p>Professional liability insurance is essential. Most policies cover $1M per occurrence / $3M aggregate. Many studios require it. Available through:</p>
<ul>
<li>Philadelphia Insurance Companies</li>
<li>Markel Insurance</li>
<li>ACE Fitness / IDEA membership insurance</li>
</ul>`
      },
      {
        id: "7-quiz",
        title: "Module 7 Quiz",
        isQuiz: true
      }
    ],
    quiz: generateModule7Quiz()
  }
];

// ===== CONTENT GENERATOR FUNCTIONS =====

function generateMatExercisesContent1() {
  const exercises = [
    { num: 1, name: "The Hundred", reps: "100 pumps", start: "Supine, curl up, legs to 45°", movement: "Pump arms vigorously up and down; inhale 5, exhale 5 × 10 cycles", primary: "Rectus abdominis, TVA, hip flexors", secondary: "Obliques, scapular stabilizers", purpose: "Warm up, abdominal endurance, circulation", errors: "Head drooping, neck tensing, legs dropping, shallow breathing" },
    { num: 2, name: "The Roll Up", reps: "3×", start: "Supine, arms overhead", movement: "Curl up vertebra by vertebra reaching toward feet, roll back down", primary: "Rectus abdominis, obliques, hip flexors", secondary: "Hamstrings, spinal erectors (eccentric)", purpose: "Abdominal strength, spinal articulation, hamstring flexibility", errors: "Using momentum, lifting legs, rolling too quickly" },
    { num: 3, name: "The Roll Over", reps: "5 sets each direction", start: "Supine, arms by sides, legs extended", movement: "Lift legs overhead, separate/flex feet, roll spine down", primary: "Deep abdominals, hip flexors", secondary: "Arms pressing down, hamstrings, gluteals", purpose: "Abdominal strength, spinal flexibility, posterior chain stretch", errors: "Rolling onto neck" },
    { num: 4, name: "Single Leg Circles", reps: "5 each direction, each leg", start: "Supine, one leg to ceiling", movement: "Circle the raised leg while maintaining pelvic stability", primary: "Hip flexors, adductors, abductors, abdominals", secondary: "Quadriceps, hamstrings, glutes", purpose: "Pelvic stabilization, hip joint mobilization", errors: "Pelvis rocking, over-large circles" },
    { num: 5, name: "Rolling Like a Ball", reps: "6×", start: "Seated, hug shins, C-curve", movement: "Roll back onto shoulder blades, roll back up to balance", primary: "Abdominals, spinal flexors", secondary: "Hip flexors, deep erectors (eccentric)", purpose: "Core control, spinal massage, balance", errors: "Rolling onto neck, shape collapsing" },
    { num: 6, name: "Single Leg Stretch", reps: "5–12 sets", start: "Supine, curl up, knees to chest", movement: "Extend one leg at 45° while holding the other shin; alternate", primary: "Rectus abdominis, TVA, hip flexors", secondary: "Obliques, hip extensors", purpose: "Core stability, coordination, rhythm", errors: "Losing spinal flexion" },
    { num: 7, name: "Double Leg Stretch", reps: "5–12×", start: "Supine, curl up, hug knees", movement: "Reach arms overhead and extend legs to 45°; circle arms back, hug knees", primary: "Rectus abdominis, TVA, hip flexors", secondary: "Shoulder extensors/flexors, obliques", purpose: "Full-body coordination, core stability test", errors: "Back arching, losing curl" },
    { num: 8, name: "Spine Stretch Forward", reps: "3×", start: "Seated, legs wider than shoulders, feet flexed", movement: "Round spine forward over legs; stack back to tall sitting", primary: "Abdominals, spinal flexors", secondary: "Hamstrings (stretched), erector spinae (eccentric)", purpose: "Hamstring stretch, spinal articulation", errors: "Rounding from hips instead of spine" },
    { num: 9, name: "Open Leg Rocker", reps: "6×", start: "Seated, balance on sacrum, legs in V", movement: "Roll back onto shoulder blades maintaining V; roll up to balance", primary: "Abdominals, hip flexors", secondary: "Hamstrings, deep back muscles", purpose: "Spinal articulation, balance, coordination", errors: "Rolling onto neck, V collapsing" },
    { num: 10, name: "The Corkscrew", reps: "3 sets each direction", start: "Supine, arms by sides, legs at 90°", movement: "Circle both legs to right, down, around, left, and up", primary: "Deep abdominals, obliques", secondary: "Arms stabilizing, glutes, adductors", purpose: "Abdominal/oblique strength, spinal mobility", errors: "Pelvis lifting off mat" },
    { num: 11, name: "The Saw", reps: "3 sets each side", start: "Seated, legs wide, arms in T", movement: "Rotate torso, reach opposite hand past outside of foot", primary: "Obliques, spinal rotators", secondary: "Back extensors, hamstrings (stretched)", purpose: "Spinal rotation, oblique strength, hamstring stretch", errors: "Hips lifting, rotating from shoulders only" },
    { num: 12, name: "The Swan-Dive", reps: "6×", start: "Prone, hands under shoulders", movement: "Press to lift chest; rock forward and back in seesaw motion", primary: "Spinal extensors, glutes", secondary: "Shoulders, hamstrings, abdominals", purpose: "Back extension strength, posterior chain activation", errors: "Lower back compression, neck craning" },
    { num: 13, name: "Single Leg Kick", reps: "5–6 sets per leg", start: "Prone, sphinx position", movement: "Kick heel to glute 2×, straighten; switch legs", primary: "Hamstrings, gluteals", secondary: "Spinal extensors, shoulder girdle", purpose: "Hamstring/glute strength, maintain back extension", errors: "Dropping chest, hip rotation" },
    { num: 14, name: "Double Leg Kick", reps: "3–5×", start: "Prone, head to one cheek, hands clasped on back", movement: "Kick both heels to seat 3×; extend into back extension with arms reaching back", primary: "Hamstrings, gluteals, spinal extensors", secondary: "Shoulder extensors, pectorals (stretched)", purpose: "Posterior chain strength, shoulder opening", errors: "Not reaching fully in extension" },
    { num: 15, name: "The Neck Pull", reps: "3–5×", start: "Supine, hands behind head, elbows wide, legs hip-width", movement: "Curl up, roll forward over legs, hinge back flat, then round to mat", primary: "Rectus abdominis, hip flexors", secondary: "Obliques, erector spinae, hamstrings", purpose: "Harder Roll Up variant — reveals core connectivity", errors: "Feet lifting, using momentum" },
    { num: 16, name: "High Scissors", reps: "5–6 sets per leg", start: "Supported shoulder stand, hands on back", movement: "Scissor legs — one toward floor, one skyward; pulse; switch", primary: "Hip flexors, abdominals, hamstrings", secondary: "Spinal erectors, shoulder stabilizers", purpose: "Hip/hamstring flexibility, abdominal endurance in inversion", errors: "Collapsing support, weight on neck" },
    { num: 17, name: "High Bicycle", reps: "5 sets per direction", start: "Same supported position as Scissors", movement: "Pedaling/cycling motion: leg extends down, bends knee, reaches heel to floor", primary: "Hip flexors, abdominals, glutes, hamstrings", secondary: "Quadriceps, shoulder stabilizers", purpose: "Hip flexibility, full hip circumduction", errors: "Losing alignment, weight shifting" }
  ];

  let html = '<div class="section-image"><img src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=400&fit=crop" alt="Pilates mat class" loading="lazy"><p class="image-caption">The 34 mat exercises form the complete classical repertoire — from the Hundred to the Push Up.</p></div>';
  html += '<h2>Joseph Pilates\' 34 Mat Exercises — Part 1 (Exercises 1–17)</h2>';
  html += '<p>The complete original sequence from <em>Return to Life Through Contrology</em> (1945). All exercises are initiated from and supported by the Powerhouse.</p>';

  exercises.forEach(ex => {
    html += `<div class="exercise-card">
      <h4><span style="color:var(--terracotta);">#${ex.num}</span> ${ex.name}</h4>
      <p><strong>Reps:</strong> ${ex.reps}</p>
      <p><strong>Starting Position:</strong> ${ex.start}</p>
      <p><strong>Movement:</strong> ${ex.movement}</p>
      <div class="exercise-detail">
        <dt>Primary Muscles</dt><dd>${ex.primary}</dd>
        <dt>Secondary Muscles</dt><dd>${ex.secondary}</dd>
        <dt>Purpose</dt><dd>${ex.purpose}</dd>
        <dt>Common Errors</dt><dd>${ex.errors}</dd>
      </div>
    </div>`;
  });
  return html;
}

function generateMatExercisesContent2() {
  const exercises = [
    { num: 18, name: "Shoulder Bridge", reps: "3 sets, 5 kicks/leg", start: "Supine, knees bent, hips lifted", movement: "Extend one leg to ceiling, lower toward floor, flex foot, lift back up", primary: "Glutes, hamstrings, hip extensors", secondary: "Abdominals, obliques, quadriceps", purpose: "Glute/hamstring strength, pelvic stability under dynamic movement" },
    { num: 19, name: "Spine Twist", reps: "3 sets each direction", start: "Seated tall, legs extended, arms in T", movement: "Rotate entire torso from the waist; return", primary: "Obliques (internal and external), TVA", secondary: "Spinal rotators, erector spinae", purpose: "Spinal rotation, oblique strengthening" },
    { num: 20, name: "The Jackknife", reps: "3×", start: "Supine, arms pressing into mat", movement: "Take legs overhead then jackknife to vertical; roll down", primary: "Abdominals, hip flexors, spinal flexors", secondary: "Arms pressing down, shoulder stabilizers", purpose: "Advanced core control, inversion confidence" },
    { num: 21, name: "Side Kick Series", reps: "3× per variation per side", start: "Side-lying, legs slightly forward", movement: "Front/Back kicks, Up/Down, Small Circles, Inner Thigh Lifts, Bicycle, Hot Potato", primary: "Gluteus medius, hip abductors/adductors", secondary: "Obliques, shoulder girdle", purpose: "Hip mobility, lateral stability, glute conditioning" },
    { num: 22, name: "The Teaser", reps: "3×", start: "Supine, arms overhead", movement: "Simultaneously lift legs to 45° and upper body to V-sit; lower together", primary: "Rectus abdominis, hip flexors, TVA", secondary: "Obliques, spinal extensors, shoulder girdle", purpose: "Full core integration, balance, coordination" },
    { num: 23, name: "Hip Twist", reps: "3 sets each direction", start: "Seated, legs lifted, hands on mat behind", movement: "Circle both legs: right, down, around, left, up; reverse", primary: "Abdominals, obliques, hip flexors", secondary: "Arms/wrists bearing weight, adductors", purpose: "Advanced core control, hip mobility" },
    { num: 24, name: "Swimming", reps: "20 pumps", start: "Prone, arms overhead, legs extended", movement: "Lift all limbs; alternate opposite arm/leg in flutter", primary: "Erector spinae, multifidus, gluteals, posterior deltoids", secondary: "Hamstrings, shoulder stabilizers, abdominals", purpose: "Full posterior chain activation, back endurance" },
    { num: 25, name: "Leg Pull Front", reps: "3 sets each leg", start: "Plank position", movement: "Lift one leg toward ceiling; return; alternate", primary: "Glutes, hip extensors, core, shoulder girdle", secondary: "Triceps, chest, abdominals", purpose: "Full-body stabilization, glute activation" },
    { num: 26, name: "Leg Pull Back", reps: "3 sets each leg", start: "Reverse plank", movement: "Flex foot and lift leg; lower; alternate", primary: "Back extensors, glutes, hamstrings, abdominals", secondary: "Shoulder extensors, wrists, triceps", purpose: "Posterior chain conditioning, shoulder mobility" },
    { num: 27, name: "Kneeling Side Kicks", reps: "4× each side", start: "Kneeling, one leg extended, hand behind head", movement: "Kick extended leg forward (double pulse) and back", primary: "Hip abductors, hip flexors, glutes", secondary: "Obliques, shoulder girdle", purpose: "Hip mobility with reduced base of support" },
    { num: 28, name: "Side Bend (Mermaid)", reps: "3× each side", start: "Seated on one hip, bottom arm on mat", movement: "Press into hand, lift to side plank, top arm arcs overhead", primary: "Obliques, abdominals, shoulder stabilizers", secondary: "Glutes, adductors, lateral trunk", purpose: "Side body strengthening, lateral flexibility" },
    { num: 29, name: "The Boomerang", reps: "6×", start: "Seated, right ankle crossed over left", movement: "Roll back, switch leg cross, roll forward to Teaser, clasp hands behind, circle arms", primary: "Abdominals, hip flexors, shoulder stabilizers", secondary: "All postural muscles", purpose: "Advanced spinal articulation, integration of many skills" },
    { num: 30, name: "The Seal", reps: "6×", start: "Seated, hands through feet, C-curve", movement: "Clap feet 3×, roll back onto shoulder blades, clap 3×, roll up", primary: "Abdominals, deep hip flexors", secondary: "Adductors, spinal flexors", purpose: "Spinal massage, core control, playful transition" },
    { num: 31, name: "The Crab", reps: "6×", start: "Similar to Seal, cross ankles, hold opposite feet", movement: "Roll back, switch cross, roll forward until top of head touches mat", primary: "Abdominals, spinal flexors", secondary: "Hip flexors, adductors", purpose: "Advanced spinal massage, deep core control" },
    { num: 32, name: "Rocking", reps: "5×", start: "Prone, hold ankles", movement: "Press ankles into hands; rock forward and back maintaining bow shape", primary: "Spinal extensors, gluteals, hamstrings", secondary: "Shoulders, hip flexors (stretched)", purpose: "Back extensor strength, spinal mobility, hip flexor stretch" },
    { num: 33, name: "Control Balance", reps: "6×", start: "Roll legs overhead, grasp one ankle", movement: "Extend other leg to ceiling; alternate in controlled scissoring", primary: "Hip flexors, abdominals, spinal stabilizers", secondary: "Shoulder stabilizers, hamstrings", purpose: "Balance, advanced core control in inversion" },
    { num: 34, name: "The Push Up", reps: "3 sets of 3–5 push-ups", start: "Standing at back of mat", movement: "Roll down, walk hands out to plank, 3–5 push-ups, pike, walk back, roll up", primary: "Triceps, pectorals, anterior deltoids, abdominals", secondary: "Serratus anterior, rhomboids, core", purpose: "Upper body/core strength, links sequence to standing" }
  ];

  let html = '<h2>Joseph Pilates\' 34 Mat Exercises — Part 2 (Exercises 18–34)</h2>';
  exercises.forEach(ex => {
    html += `<div class="exercise-card">
      <h4><span style="color:var(--terracotta);">#${ex.num}</span> ${ex.name}</h4>
      ${ex.reps ? `<p><strong>Reps:</strong> ${ex.reps}</p>` : ''}
      <p><strong>Starting Position:</strong> ${ex.start}</p>
      <p><strong>Movement:</strong> ${ex.movement}</p>
      <div class="exercise-detail">
        <dt>Primary Muscles</dt><dd>${ex.primary}</dd>
        <dt>Secondary</dt><dd>${ex.secondary}</dd>
        <dt>Purpose</dt><dd>${ex.purpose}</dd>
      </div>
    </div>`;
  });
  return html;
}

function generateMagicCircleContent() {
  return `<h2>Magic Circle / Pilates Ring — 23 Exercises</h2>
<p>The Magic Circle was designed by Joseph Pilates himself, reportedly fashioned from a wine keg ring. It provides resistance through compression (pushing pads together) or traction (pulling apart), recruiting deep stabilizing muscles.</p>

<h3>Supine Exercises (1–9)</h3>
<div class="exercise-card"><h4>1. Hundred with Magic Circle</h4><p><strong>Ring:</strong> Between ankles (adduction) or around outside (abduction). Standard Hundred with added inner/outer thigh engagement.</p></div>
<div class="exercise-card"><h4>2. Bridge with Magic Circle</h4><p><strong>Ring:</strong> Between inner thighs above knees. Squeeze ring as you peel up to bridge; pulse at top.</p></div>
<div class="exercise-card"><h4>3. Double Leg Stretch with MC</h4><p><strong>Ring:</strong> Between ankles. Standard DLS with constant adductor engagement.</p></div>
<div class="exercise-card"><h4>4. Criss Cross with MC</h4><p><strong>Ring:</strong> Between palms. Rotate ribcage reaching ring toward opposite knee.</p></div>
<div class="exercise-card"><h4>5. Scissors with MC</h4><p><strong>Ring:</strong> Between palms overhead; bring one leg to touch ring.</p></div>
<div class="exercise-card"><h4>6. Supine Twist</h4><p><strong>Ring:</strong> Between ankles. Knees at 90°, arms in T. Lower legs side to side.</p></div>
<div class="exercise-card"><h4>7. Side Leg Lifts — Adduction</h4><p><strong>Ring:</strong> Between ankles. Side-lying; lift both legs compressing ring inward.</p></div>
<div class="exercise-card"><h4>8. Side Leg Lifts — Abduction</h4><p><strong>Ring:</strong> Around outside of ankles. Side-lying; press outward against ring.</p></div>
<div class="exercise-card"><h4>9. Side Lying Corkscrew</h4><p><strong>Ring:</strong> Between ankles. Lift legs, rotate ring alternating top/bottom leg forward.</p></div>

<h3>Prone Exercises (10–13)</h3>
<div class="exercise-card"><h4>10. Swan Dive with MC</h4><p><strong>Ring:</strong> Upright on mat, hands pressing top. Press into ring lifting chest into Swan.</p></div>
<div class="exercise-card"><h4>11. Single Arm Leg Lift</h4><p><strong>Ring:</strong> Upright in one hand. Press down; lift chest, opposite arm, and same-side leg.</p></div>
<div class="exercise-card"><h4>12. Swimming with MC</h4><p><strong>Ring:</strong> Held overhead. Flutter kick while maintaining ring position.</p></div>
<div class="exercise-card"><h4>13. Heel Beats with MC</h4><p><strong>Ring:</strong> In hands extended forward. Lift chest and legs; beat heels together.</p></div>

<h3>Seated Exercises (14–17)</h3>
<div class="exercise-card"><h4>14. Roll Up with MC</h4><p><strong>Ring:</strong> Between palms overhead. Roll up to seated squeezing ring throughout.</p></div>
<div class="exercise-card"><h4>15. Spine Stretch with MC</h4><p><strong>Ring:</strong> Between palms forward. Round forward over legs with ring reaching toward floor.</p></div>
<div class="exercise-card"><h4>16. Saw with MC</h4><p><strong>Ring:</strong> Between palms at chest. Rotate and reach ring toward outside of foot.</p></div>
<div class="exercise-card"><h4>17. Half Roll Down with MC</h4><p><strong>Ring:</strong> Between thighs. Squeeze as you curl back into C-curve.</p></div>

<h3>Standing Exercises (18–20)</h3>
<div class="exercise-card"><h4>18. Standing V-Squeeze</h4><p><strong>Ring:</strong> Between upper thighs. Heels together, toes apart; squeeze. Add squat.</p></div>
<div class="exercise-card"><h4>19. Side Lunge Heel Press</h4><p><strong>Ring:</strong> Held overhead. Wide stance, lunge to one side with heel lift.</p></div>
<div class="exercise-card"><h4>20. Chest Expansion (Standing)</h4><p><strong>Ring:</strong> Behind back. Press ring while drawing shoulders back; rotate head.</p></div>

<h3>Kneeling/Side Exercises (21–23)</h3>
<div class="exercise-card"><h4>21. Side Kneeling Oblique Press</h4><p><strong>Ring:</strong> Upright to one side. Side-bend pressing down; reach top arm over.</p></div>
<div class="exercise-card"><h4>22. Side Plank Clams with MC</h4><p><strong>Ring:</strong> In hand or under hip. Side plank with clamshell top leg rotation.</p></div>
<div class="exercise-card"><h4>23. Mermaid with MC</h4><p><strong>Ring:</strong> Upright on one side. Sit in half-straddle; lean to ring pressing down.</p></div>`;
}

function generateOverballContent() {
  return `<h2>Overball / Squishy Ball — 21 Exercises</h2>
<p>The overball (20–25 cm) creates targeted resistance through compression and instability to recruit deep stabilizing muscles.</p>

<h3>Ball Placement Effects</h3>
<ul>
<li><strong>Between knees:</strong> Activates inner thighs → pelvic floor connection</li>
<li><strong>Under sacrum:</strong> Creates instability → deeper abdominal engagement</li>
<li><strong>Under lumbar:</strong> Provides support, feedback for neutral spine</li>
<li><strong>Under shoulder blades:</strong> Supports thoracic extension</li>
<li><strong>Behind knee:</strong> Creates hamstring connection</li>
</ul>

<h3>Supine Exercises (1–10)</h3>
<div class="exercise-card"><h4>1. Inner Thigh Squeeze</h4><p>Ball between knees. Squeeze firmly 3 seconds, release slightly. 15–20 reps. Foundational pelvic floor activation.</p></div>
<div class="exercise-card"><h4>2. Glute Bridge with Ball</h4><p>Ball between knees. Squeeze as you bridge; add pulses at top.</p></div>
<div class="exercise-card"><h4>3. Pelvic Curl with Ball</h4><p>Ball between knees. Squeeze, imprint spine, curl tailbone up through articulation.</p></div>
<div class="exercise-card"><h4>4. Leg Lifts with Ball</h4><p>Ball between ankles. Legs extended; lift to ceiling, lower slowly.</p></div>
<div class="exercise-card"><h4>5. Toe Taps with Ball Under Sacrum</h4><p>Ball under sacrum. Legs at 90°; slowly tap one foot to floor, alternate.</p></div>
<div class="exercise-card"><h4>6. Clamshell with Ball</h4><p>Side-lying, ball between ankles. Lift top knee in clamshell while squeezing.</p></div>
<div class="exercise-card"><h4>7. Single Leg Stretch with Ball</h4><p>Ball between knees in tabletop. Standard SLS with constant adductor engagement.</p></div>
<div class="exercise-card"><h4>8. Double Leg Stretch with Ball</h4><p>Ball between knees or ankles. Standard DLS with squeeze on extension.</p></div>
<div class="exercise-card"><h4>9. Crescent Moons</h4><p>Ball between lower calves. Roll legs on ball, lower and switch cross.</p></div>
<div class="exercise-card"><h4>10. Single Leg Circle on Ball</h4><p>Ball under one ankle. Circle raised leg with resting leg elevated on ball.</p></div>

<h3>Seated Exercises (11–13)</h3>
<div class="exercise-card"><h4>11. Roll-Down with Ball Between Knees</h4><p>Squeeze ball throughout roll-down and roll-up for constant adductor engagement.</p></div>
<div class="exercise-card"><h4>12. C-Curve Work</h4><p>Ball behind lumbar spine. Lean back creating C-curve; ball provides feedback. Add rotation.</p></div>
<div class="exercise-card"><h4>13. Thoracic Extension</h4><p>Ball under shoulder blades. Arch over ball; crunch up. Add rotation.</p></div>

<h3>Kneeling Exercises (14–16)</h3>
<div class="exercise-card"><h4>14. Quadruped with Ball Behind Knee</h4><p>Squeeze ball behind knee; extend that leg back without dropping ball.</p></div>
<div class="exercise-card"><h4>15. Bird Dog with Ball</h4><p>Ball behind knee; extend opposite arm and ball-holding leg.</p></div>
<div class="exercise-card"><h4>16. Kneeling Float</h4><p>Ball between knees. Tuck toes, engage core, float knees 1 inch off mat.</p></div>

<h3>Side-Lying Exercises (17–19)</h3>
<div class="exercise-card"><h4>17. Inner Thigh Lift</h4><p>Ball between ankles. Lift both legs. Lower with control.</p></div>
<div class="exercise-card"><h4>18. Leg Circles</h4><p>Ball between ankles. Circle top leg maintaining hip stacking.</p></div>
<div class="exercise-card"><h4>19. Side Plank Prep</h4><p>Ball between knees. Lift hips into side plank while squeezing.</p></div>

<h3>Prone Exercises (20–21)</h3>
<div class="exercise-card"><h4>20. Swan Press with Ball</h4><p>Ball under palms. Press into ball lifting chest into Swan extension.</p></div>
<div class="exercise-card"><h4>21. Prone Inner Thigh Squeeze</h4><p>Ball between ankles. Straighten legs, point feet, squeeze. Hold 10 counts.</p></div>`;
}

// ============================================================================
// REFORMER MODULE — 6-SECTION REBUILD (NUMA voice, no photos)
// Written from PIA-Reformer-301 material + Classical Pilatesology sequence
// Paraphrased in NUMA's own words. No images.
// ============================================================================

function _nX(ex) {
  const badgeClass = ex.badge === 'contemporary' ? 'badge-contemporary' : 'badge-classical';
  const badgeText = ex.badge === 'contemporary' ? 'Contemporary' : 'Classical';
  return `<div class="exercise-card">
<h4>${ex.name} <span class="${badgeClass}">${badgeText}</span></h4>
<table class="exercise-table">
<tr><th>Purpose</th><td>${ex.purpose}</td></tr>
<tr><th>Hand/Foot Placement</th><td>${ex.placement}</td></tr>
<tr><th>Setup</th><td>${ex.setup}</td></tr>
<tr><th>Cue</th><td>${ex.cue}</td></tr>
<tr><th>Muscle Focus</th><td>${ex.muscles}</td></tr>
<tr><th>Modifications &amp; Variations</th><td>${ex.mods}</td></tr>
</table>
</div>`;
}

function _nSeries(title, isContemporary) {
  return `<div class="series-header${isContemporary ? ' contemporary-header' : ''}">${title}${isContemporary ? ' — Contemporary Additions' : ''}</div>`;
}

function _nBadgeStyles() {
  return `<style>
.badge-classical, .badge-contemporary { display:inline-block; font-size:0.72rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:999px; vertical-align:middle; margin-left:8px; }
.badge-classical { background:#7A6655; color:#FAF7F2; }
.badge-contemporary { background:#FAF7F2; color:#7A6655; border:1px solid #A38D78; }
.exercise-table { width:100%; border-collapse:collapse; margin-top:12px; font-size:0.92rem; }
.exercise-table th, .exercise-table td { border:1px solid #E2DCD4; padding:8px 12px; text-align:left; vertical-align:top; }
.exercise-table th { background:#F0EBE3; color:#7A6655; width:24%; font-weight:600; }
.series-header { margin-top:32px; padding:10px 16px; background:#7A6655; color:#FAF7F2; border-radius:6px; font-size:1rem; letter-spacing:0.05em; text-transform:uppercase; font-weight:600; }
.contemporary-header { background:#A38D78; }
.level-intro { background:#FAF7F2; border-left:4px solid #A38D78; padding:16px 20px; margin:16px 0 24px; border-radius:4px; }
</style>`;
}

// ============================================================================
// SECTION 1: ANATOMY, SAFETY & HISTORY
// ============================================================================

function generateReformerAnatomyContent() {
  return _nBadgeStyles() + `
<h2>The Reformer — Anatomy, Safety &amp; History</h2>

<div class="level-intro">
<p><strong>Welcome to the Reformer.</strong> Joseph Pilates' signature apparatus is a spring-loaded sliding carriage system that trains the whole body against smooth, variable resistance. Before you teach a single exercise, you have to know the machine, respect the springs, and understand where this work comes from.</p>
</div>

<h3>A Brief History of the Reformer</h3>
<p>Joseph Pilates developed the earliest version of what he called the "Universal Reformer" during his internment in England during World War I. Working with injured soldiers and bedridden patients, he attached springs to hospital beds so people could begin rehabilitation before they could stand. Those springs, that horizontal position, and the concept of assisted, resisted movement became the foundation of the apparatus we still use today.</p>
<p>By the time Joe opened his New York studio on Eighth Avenue in 1926, the Reformer was central to his method. The classical Gratz Reformer — built to his exact specifications with a single uniform spring weight — remains the closest thing to his original design. Contemporary manufacturers like Balanced Body, STOTT, and Peak Pilates offer color-coded springs of varying resistance, giving teachers more precision but also more decisions.</p>

<h3>Reformer Anatomy — Know Every Part</h3>
<table>
<tr><th>Component</th><th>What It Is</th><th>Why It Matters</th></tr>
<tr><td><strong>Frame</strong></td><td>The wooden or metal base that houses the entire apparatus.</td><td>Provides the stable structure. Never step on it as a shortcut.</td></tr>
<tr><td><strong>Carriage</strong></td><td>The padded, sliding platform that moves on wheels along the rails.</td><td>Where the client lies, sits, kneels, or stands. It is always moving — respect the momentum.</td></tr>
<tr><td><strong>Springs</strong></td><td>Four or five springs connecting carriage to frame.</td><td>Provide resistance. On classical, all one weight. On contemporary, color-coded.</td></tr>
<tr><td><strong>Gearbar / Spring Bar</strong></td><td>The bar the springs hook onto (contemporary only).</td><td>Different positions change spring tension length.</td></tr>
<tr><td><strong>Footbar</strong></td><td>Padded bar at one end, usually adjustable.</td><td>Push-off point for footwork, plank series, and standing work.</td></tr>
<tr><td><strong>Headrest</strong></td><td>Small hinged pad at the head end of the carriage.</td><td>Up for spinal flexion (protects neck); down for neutral and extension work.</td></tr>
<tr><td><strong>Shoulder Blocks</strong></td><td>Padded blocks at the head end that flank the carriage.</td><td>Prevent sliding when pushing away from the footbar; provide grip in inversions.</td></tr>
<tr><td><strong>Ropes &amp; Risers</strong></td><td>Straps or ropes attached to the carriage via pulleys at the shoulder end.</td><td>Hand or foot loops for upper body, leg, and box work.</td></tr>
<tr><td><strong>Long Box</strong></td><td>Padded rectangular box placed lengthwise on the carriage.</td><td>Used for prone, supine, and seated exercises off the carriage surface.</td></tr>
<tr><td><strong>Short Box</strong></td><td>The same box placed widthwise across the carriage.</td><td>Seated abdominal, side, and rotation work with feet anchored.</td></tr>
<tr><td><strong>Jumpboard</strong></td><td>Removable padded board that replaces the footbar.</td><td>Turns the Reformer into a horizontal cardio trampoline.</td></tr>
<tr><td><strong>Sitting Platform</strong></td><td>Fixed platform at the shoulder end of the frame.</td><td>Standing surface for side splits, mermaid, and hybrid standing work.</td></tr>
</table>

<h3>Spring Resistance (Contemporary — Balanced Body Standard)</h3>
<table>
<tr><th>Color</th><th>Value</th><th>Feels Like</th><th>Common Use</th></tr>
<tr><td><strong>Yellow</strong></td><td>¼ (very light)</td><td>Assistive, barely there</td><td>Feet in straps for beginners, arm work for smaller clients</td></tr>
<tr><td><strong>Blue</strong></td><td>½ (light)</td><td>Light and controlled</td><td>Arm work, feet in straps, ab work</td></tr>
<tr><td><strong>Red</strong></td><td>1 (medium/heavy)</td><td>The workhorse spring</td><td>Footwork, kneeling series, plank series</td></tr>
<tr><td><strong>Green</strong></td><td>2 (heavy)</td><td>Very heavy</td><td>Heavy footwork, standing work</td></tr>
<tr><td><strong>Two Reds</strong></td><td>Balanced load</td><td>Solid, controllable</td><td>Standing side splits, heavier footwork</td></tr>
<tr><td><strong>All Springs</strong></td><td>Stabilized</td><td>Locked-feeling carriage</td><td>Long box work, safety default when in doubt</td></tr>
</table>
<p><em>Classical note:</em> Gratz Reformers do not use color coding. They use a single, heavier universal spring, and load is adjusted by the <em>number</em> of springs, not the color.</p>

<h3>Safety Protocols — Non-Negotiable</h3>
<ul>
<li>Check spring attachment before every client. Springs walk loose over time.</li>
<li>Never let a carriage move without an anchored body on it. A loose carriage with a spring popping is dangerous.</li>
<li>Mount and dismount deliberately — one point of contact, then two, then transfer weight.</li>
<li>Headrest up for any spinal flexion (Hundred, ab prep). Down for neutral or extension.</li>
<li>When changing springs mid-exercise, hold the carriage in with your hand. Never let a client hold the load while you swap.</li>
<li>Spot every inversion, every Long Spine, every Snake/Twist. Hand under the shoulders.</li>
<li>Watch fingers around the gearbar, ropes, and the space between carriage and frame.</li>
<li>Communicate every spring change out loud — "Adding a red for footwork."</li>
</ul>

<h3>The Five Foundational Components</h3>
<p>Every Reformer exercise, from Footwork to Snake, is built on the same five principles. Return to them constantly.</p>
<table>
<tr><th>Component</th><th>What It Means on the Reformer</th></tr>
<tr><td><strong>Core</strong></td><td>Deep abdominal engagement and pelvic-floor connection stabilize the pelvis and spine while the carriage moves.</td></tr>
<tr><td><strong>Breath</strong></td><td>Diaphragmatic (belly) inhale, posterior lateral (back and side rib) inhale. Exhale on exertion. Never hold the breath.</td></tr>
<tr><td><strong>Alignment</strong></td><td>Neutral pelvis, stacked ribs over hips, elongated cervical spine. The reformer exaggerates any misalignment.</td></tr>
<tr><td><strong>Balance</strong></td><td>Even distribution between right and left, front and back. The moving carriage exposes side dominance instantly.</td></tr>
<tr><td><strong>Awareness</strong></td><td>Presence. Feeling the spring load, the shift of weight, the position of the pelvis. Teach clients to feel, not just perform.</td></tr>
</table>

<h3>Six Ways to Modify Any Exercise</h3>
<p>When an exercise doesn't fit the client, don't skip it — modify it. NUMA teachers use six levers:</p>
<ol>
<li><strong>Lever length</strong> — bend a limb to shorten the lever, straighten it to lengthen.</li>
<li><strong>Range of motion</strong> — smaller range for less challenge, larger for more.</li>
<li><strong>Props</strong> — magic circle, overball, block, strap.</li>
<li><strong>Assist or resist</strong> — add a spring to assist a weak movement; remove to demand more.</li>
<li><strong>Simplify or complicate</strong> — remove a variable (both feet down) or add one (one leg lifted).</li>
<li><strong>Speed</strong> — slow it down to expose control; speed it up to challenge coordination.</li>
</ol>

<h3>NUMA Level Progression</h3>
<p>This module organizes the Reformer repertoire in the way we teach it at NUMA:</p>
<table>
<tr><th>Level</th><th>Focus</th><th>Who's Ready</th></tr>
<tr><td><strong>Level 1 — Foundation</strong></td><td>Neutral spine, basic spring management, breath, footwork, feet in straps, elephant, basic arm work.</td><td>New clients, first 6–8 sessions.</td></tr>
<tr><td><strong>Level 1.5 — Intermediate</strong></td><td>Add coordination, Hundred, Short Box, Long Spine, Chest Expansion, plank series, seated back rowing.</td><td>Clients with clean neutral pelvis and confident spring changes.</td></tr>
<tr><td><strong>Level 2 — Advanced</strong></td><td>Full repertoire: Snake/Twist, Star, Control Balance, Teaser on the Box, Long Back Stretch, Kneeling Side Arm, Backstroke.</td><td>Clients with body awareness, strength, and control across all planes.</td></tr>
</table>
`;
}

// ============================================================================
// SECTION 2: REFORMER LEVEL 1
// ============================================================================

function generateReformerLevel1Content() {
  const parts = [];
  parts.push(`<h2>Reformer Level 1 — Foundation Repertoire</h2>
<div class="level-intro">
<p>Level 1 builds the base every future exercise depends on: neutral pelvis, connected breath, confident spring management, and clean footwork mechanics. Do not rush through this level. A client who owns their Level 1 owns everything above it.</p>
<p>Exercises are ordered in the <strong>classical sequence</strong> first, followed by <strong>contemporary additions</strong> we include at NUMA.</p>
</div>`);

  // --- FOOTWORK ---
  parts.push(_nSeries('Series 1 — Footwork'));
  parts.push(_nX({
    name: 'Footwork — Toes (Pilates V)',
    badge: 'classical',
    purpose: 'Warm the body, wake the feet, connect the leg line into the pelvis. Establishes neutral spine under load.',
    placement: 'Balls of the feet on the footbar, heels lifted and pressed together in a small Pilates V. Hands rest by hips or on the frame.',
    setup: 'Supine on the carriage, headrest flat or slightly elevated, shoulders under the blocks, pelvis neutral. Spring load: 3 to 4 reds (classical) or 3 reds (contemporary).',
    cue: '"Press evenly through the balls of both feet. Lengthen the crown of the head away from the tailbone as the carriage moves out."',
    muscles: 'Quadriceps, gluteals, calves, hip external rotators, deep abdominals.',
    mods: 'Reduce spring load for weaker knees. Add a small ball between the ankles to cue adductor engagement. Progress by decreasing hand contact.'
  }));
  parts.push(_nX({
    name: 'Footwork — Arches',
    badge: 'classical',
    purpose: 'Engage the intrinsic foot and peroneals. Trains a strong, articulated foot.',
    placement: 'Arches of the feet cupped over the footbar, feet parallel and hip-distance apart.',
    setup: 'Same supine setup. Springs unchanged from Toes.',
    cue: '"Wrap the arches around the bar as if you\'re gripping a curb with your feet."',
    muscles: 'Quadriceps, peroneals, intrinsic foot muscles, adductors.',
    mods: 'For sensitive arches, place a small towel over the bar. Reduce range if calves cramp.'
  }));
  parts.push(_nX({
    name: 'Footwork — Heels',
    badge: 'classical',
    purpose: 'Isolate the posterior chain. Stretch the calves and Achilles under load.',
    placement: 'Heels on the footbar, toes drawn back toward the shins in dorsiflexion, feet hip-distance and parallel.',
    setup: 'Same supine setup.',
    cue: '"Toes reach for your face while you press the carriage out through the heels."',
    muscles: 'Hamstrings, gluteals, quadriceps, tibialis anterior.',
    mods: 'Reduce dorsiflexion for tight calves. Bend knees slightly at the end if hamstrings cramp.'
  }));
  parts.push(_nX({
    name: 'Footwork — Tendon Stretch',
    badge: 'classical',
    purpose: 'Lengthen the gastrocnemius and soleus. Train ankle articulation.',
    placement: 'Balls of the feet on the footbar in Pilates V. Heels rise and lower below the bar.',
    setup: 'Same supine setup. Carriage stays out at full extension.',
    cue: '"Rise onto the balls of the feet, then let the heels drop below the bar with control."',
    muscles: 'Gastrocnemius, soleus, deep intrinsic foot.',
    mods: 'Reduce heel drop for Achilles sensitivity. Reduce reps for beginners.'
  }));
  parts.push(_nX({
    name: 'Footwork — Running',
    badge: 'classical',
    purpose: 'Cardiovascular finish for the footwork series. Trains alternating leg mechanics.',
    placement: 'Balls of both feet on the footbar in Pilates V.',
    setup: 'Carriage stays extended. Alternate one heel lifting as the other lowers, like slow running in place.',
    cue: '"One heel presses the floor while the other lifts. Even, rhythmic, no bouncing pelvis."',
    muscles: 'Calves, quadriceps, gluteals, deep abdominals.',
    mods: 'Slow the tempo. Reduce reps. Keep carriage fully extended throughout.'
  }));

  parts.push(_nSeries('Series 1 — Footwork', true));
  parts.push(_nX({
    name: 'Footwork — Parallel (Contemporary)',
    badge: 'contemporary',
    purpose: 'Neutral-stance footwork without external rotation. Common in modern studios and helpful for hip-restricted clients.',
    placement: 'Balls of the feet on the footbar, feet parallel and hip-distance apart.',
    setup: 'Same supine setup. 3 reds.',
    cue: '"Feet track over second and third toes. Knees bend directly over the ankles."',
    muscles: 'Quadriceps, hamstrings, calves.',
    mods: 'Interchangeable with classical positions. Cue neutral pelvis emphatically.'
  }));
  parts.push(_nX({
    name: 'Footwork — Wide Second',
    badge: 'contemporary',
    purpose: 'Target inner thighs and lateral hips. Widens the base for stability challenge.',
    placement: 'Feet wide on the footbar, toes turned out modestly, heels on the bar.',
    setup: 'Same supine setup.',
    cue: '"Track knees over pinky toes as you press out. Squeeze thighs together on the way in."',
    muscles: 'Adductors, gluteals, quadriceps.',
    mods: 'Reduce width for hip discomfort. Add a red for stronger clients.'
  }));

  // --- SUPINE ---
  parts.push(_nSeries('Series 2 — Supine (Non-Footwork)'));
  parts.push(_nX({
    name: 'Ab Prep',
    badge: 'classical',
    purpose: 'The foundational spinal flexion pattern. Prepares the client for The Hundred, Coordination, and every advanced supine exercise.',
    placement: 'Hands can rest by the sides on the carriage or hold light straps behind the head.',
    setup: 'Supine, knees in tabletop or feet on footbar. Headrest up. Springs: 2 to 3 reds if using the footbar, 1 red if using straps.',
    cue: '"Inhale to prepare. Exhale, lift the head, curl the ribs toward the hips. Eyes to the belly button."',
    muscles: 'Rectus abdominis, obliques, deep neck flexors.',
    mods: 'Keep the head down and only lift the ribs for cervical issues. Progress by adding straps.'
  }));
  parts.push(_nX({
    name: 'Arm Circle Series — Lower &amp; Lift',
    badge: 'classical',
    purpose: 'Train shoulder mobility and scapular control against light spring resistance.',
    placement: 'Hands in the arm straps, arms straight up over the shoulders, palms facing down.',
    setup: 'Supine, headrest flat, feet on the footbar or bent on the carriage. Springs: 1 blue or 1 red (light).',
    cue: '"Ribs stay heavy. Arms lower only as far as the shoulders can stay soft."',
    muscles: 'Anterior deltoid, latissimus dorsi, serratus anterior, deep abdominals.',
    mods: 'Reduce the range of arm lower for shoulder restriction. Do only the ab-adduction and circles for stiff shoulders.'
  }));
  parts.push(_nX({
    name: 'Arm Circle Series — Circles',
    badge: 'classical',
    purpose: 'Full shoulder circumduction against spring resistance.',
    placement: 'Arms straight up, palms down.',
    setup: 'Same as above.',
    cue: '"Circle from the shoulder joint, not the elbow. Small, controlled, even."',
    muscles: 'Full shoulder girdle, latissimus, pecs, deep abdominals.',
    mods: 'Reduce circle size. Perform one direction only for shoulder recovery.'
  }));
  parts.push(_nX({
    name: 'Arm Circle Series — Triceps Press',
    badge: 'classical',
    purpose: 'Isolate the triceps against light spring resistance.',
    placement: 'Hands in straps, elbows bent at 90 degrees, upper arms alongside the head.',
    setup: 'Same supine setup.',
    cue: '"Extend from the elbow only. Upper arm stays glued next to the ear."',
    muscles: 'Triceps brachii, deep abdominals.',
    mods: 'Bring elbows slightly wider if shoulder is tight overhead.'
  }));
  parts.push(_nX({
    name: 'Feet in Straps — Frogs',
    badge: 'classical',
    purpose: 'Introduction to feet-in-straps work. Trains hip mobility and pelvic stability.',
    placement: 'Feet in the loops (or straps around the feet), heels together, toes softly pointed in Pilates V.',
    setup: 'Supine, headrest flat, arms by sides. Springs: 1 red or 1 red + 1 blue.',
    cue: '"Draw the heels toward the seat, then press out to a diamond. Pelvis stays glued to the carriage."',
    muscles: 'Hip flexors, hip extensors, adductors, hamstrings.',
    mods: 'Reduce range. Use two feet in one loop if straps feel unstable. Add a headrest support for the neck.'
  }));
  parts.push(_nX({
    name: 'Feet in Straps — Circles',
    badge: 'classical',
    purpose: 'Mobility for the hip socket. Balanced work through the rotators.',
    placement: 'Same as Frogs.',
    setup: 'Same supine setup.',
    cue: '"Circle from the hip joint. Small circles first. Reverse the direction after five."',
    muscles: 'Hip rotators, abductors, adductors, deep abdominals.',
    mods: 'Reduce circle size. Do one leg at a time for coordination issues.'
  }));

  // --- LONG BOX (prone Breast Stroke Prep) ---
  parts.push(_nSeries('Series 3 — Long Box (Prone Basics)'));
  parts.push(_nX({
    name: 'Breast Stroke Prep',
    badge: 'classical',
    purpose: 'Introduce prone thoracic extension under light spring resistance. Prepares the back for full Breast Stroke and Pulling Straps later.',
    placement: 'Hands in the arm straps, elbows bent, forearms parallel to the floor.',
    setup: 'Long box placed lengthwise on the carriage. Prone on the box, facing the footbar, hips over the front edge. Springs: 1 blue (very light).',
    cue: '"Exhale, sweep the arms overhead without letting the hands drop toward the springs. Inhale, circle wide back to start."',
    muscles: 'Posterior deltoid, rhomboids, mid trapezius, spinal extensors, gluteals.',
    mods: 'Keep the chest heavy on the box for beginners. Add thoracic extension only when strength is present.'
  }));

  // --- LUNGING ---
  parts.push(_nSeries('Series 4 — Lunging'));
  parts.push(_nX({
    name: 'Lunge (Kneeling Runner)',
    badge: 'classical',
    purpose: 'Open the front of the hip. Stretch hip flexors and quads while training pelvic stability.',
    placement: 'Front foot flat on the footbar, back knee down on the carriage, hands on the shoulder blocks or footbar for balance.',
    setup: 'Springs: 1 red (moderate). Headrest flat.',
    cue: '"Sink the pelvis toward the front heel. Chest lifts. Back thigh reaches long."',
    muscles: 'Hip flexors, quadriceps, gluteals of the back leg.',
    mods: 'Place a pad under the back knee. Reduce depth of the lunge. Hold shoulder blocks for balance.'
  }));

  // --- STANDING ---
  parts.push(_nSeries('Series 5 — Standing / Plank'));
  parts.push(_nX({
    name: 'Elephant',
    badge: 'classical',
    purpose: 'Trains posterior chain length and deep abdominal engagement in a standing pike. Foundational plank series exercise.',
    placement: 'Feet flat on the carriage, heels against the shoulder blocks. Hands on the footbar, shoulder-width.',
    setup: 'Standing in a pike, pelvis over the heels, spine in a rounded C-curve. Springs: 1 to 2 reds.',
    cue: '"Round the spine like a scoop of ice cream. Push the carriage out one inch with the abdominals. Pull it home with the abdominals."',
    muscles: 'Deep abdominals, hamstrings, hip flexors, latissimus.',
    mods: 'Reduce the carriage movement to just a few inches. Bend the knees slightly for tight hamstrings.'
  }));
  parts.push(_nX({
    name: 'Pelvic Lift Prep',
    badge: 'classical',
    purpose: 'Introduces the bridge shape on the reformer. Trains hamstring and glute engagement against spring resistance.',
    placement: 'Feet on the footbar, hip-distance, parallel. Hands by sides on the carriage.',
    setup: 'Supine, headrest flat, knees bent. Springs: 2 to 3 reds.',
    cue: '"Peel the tailbone off the carriage first. Pause at the top with hips level. Roll down bone by bone."',
    muscles: 'Gluteals, hamstrings, spinal erectors, deep abdominals.',
    mods: 'Reduce spring for beginners so the hamstrings do more work. Hold at the top and add small pulses for a progression.'
  }));

  return parts.join('\n');
}

// ============================================================================
// SECTION 3: REFORMER 1.5 INTERMEDIATE
// ============================================================================

function generateReformerLevel15Content() {
  const parts = [];
  parts.push(`<h2>Reformer 1.5 — Intermediate Repertoire</h2>
<div class="level-intro">
<p>Level 1.5 layers coordination, articulation, and stamina onto the Level 1 base. Clients must own neutral pelvis and confident spring changes before entering this level. Cueing shifts from "find the position" to "flow through the position."</p>
</div>`);

  // FOOTWORK — none new; Level 1 footwork continues.

  // SUPINE
  parts.push(_nSeries('Series 1 — Supine'));
  parts.push(_nX({
    name: 'The Hundred',
    badge: 'classical',
    purpose: 'Warm the body and connect breath to core. The classical pulse-work of the Pilates method, adapted to the reformer.',
    placement: 'Hands in the arm straps (or holding the top of the straps), arms extended long past the hips.',
    setup: 'Supine, headrest up, legs in tabletop or extended to 45 degrees, spine curled into ab prep. Springs: 1 red or 1 red + 1 blue.',
    cue: '"Inhale for 5 counts, exhale for 5. Arms pump six inches. Long past the hips."',
    muscles: 'Rectus abdominis, obliques, hip flexors, deep neck flexors, latissimus.',
    mods: 'Keep knees in tabletop for beginners. Head down variation for cervical issues. Reduce to 50 pulses.'
  }));
  parts.push(_nX({
    name: 'Coordination',
    badge: 'classical',
    purpose: 'Full-body coordination pattern. Tests abdominal stability while limbs move independently.',
    placement: 'Hands in arm straps.',
    setup: 'Supine, headrest up, spine curled into ab prep. Legs in tabletop. Springs: 1 red or 1 red + 1 blue.',
    cue: '"Arms extend, legs extend, legs open, legs close, arms bend, legs bend. Six moving parts, one breath phrase."',
    muscles: 'Rectus abdominis, hip flexors, adductors, triceps, latissimus.',
    mods: 'Take one variable out at a time (skip the leg open-close). Slow the tempo down to establish sequence.'
  }));
  parts.push(_nX({
    name: 'Feet in Straps — Long Spine',
    badge: 'classical',
    purpose: 'Full spinal articulation through inversion. Deep hamstring stretch. Advanced feet-in-straps work.',
    placement: 'Feet in straps, heels together, Pilates V.',
    setup: 'Supine, headrest flat, arms alongside the body. Springs: 1 to 2 reds.',
    cue: '"Legs press to the ceiling. Roll the pelvis up in one line. Open the legs at the top. Roll down bone by bone."',
    muscles: 'Hamstrings, deep abdominals, spinal erectors, gluteals.',
    mods: 'Skip the leg opening for beginners. Reduce spring for weaker abdominals. Spot at the shoulders.'
  }));
  parts.push(_nX({
    name: 'Feet in Straps — Short Spine',
    badge: 'classical',
    purpose: 'Articulated inversion with knees bent. Trains spinal segmentation and hamstring flexibility.',
    placement: 'Feet in straps.',
    setup: 'Supine, headrest flat. Springs: 1 red + 1 blue.',
    cue: '"Legs press up. Roll the pelvis up. Bend the knees toward the ears. Roll down through the spine leaving the knees folded until the tailbone lands."',
    muscles: 'Hamstrings, deep abdominals, gluteals, spinal flexors.',
    mods: 'Shorten the range. Skip the fold if hamstrings are tight. Spot every rep.'
  }));

  // ARMS IN STRAPS - covered above via Arm Circle in L1; here we add supine variations more sophisticated? skip

  // LONG BOX
  parts.push(_nSeries('Series 2 — Long Box'));
  parts.push(_nX({
    name: 'Pulling Straps 1',
    badge: 'classical',
    purpose: 'Prone posterior chain work. Trains scapular retraction and thoracic extension.',
    placement: 'Hands hold the straps just above the metal hardware. Palms face down initially.',
    setup: 'Long box on carriage. Prone on box, facing headrest, hips over front edge of box. Springs: 1 red.',
    cue: '"Slide the shoulder blades down. Pull the straps back to the hips as you lift into thoracic extension."',
    muscles: 'Posterior deltoid, rhomboids, mid and lower trapezius, spinal extensors.',
    mods: 'Keep chest heavy on the box for beginners. Reduce spring load if the arms can\'t reach.'
  }));
  parts.push(_nX({
    name: 'Pulling Straps 2 (T-Straps)',
    badge: 'classical',
    purpose: 'Prone T-pull. Targets mid-back and posterior deltoid more directly than Pulling Straps 1.',
    placement: 'Same as Pulling Straps 1.',
    setup: 'Same setup.',
    cue: '"Arms sweep out to a T. Squeeze the shoulder blades together. Hold the thoracic extension."',
    muscles: 'Posterior deltoid, rhomboids, mid trapezius, spinal extensors.',
    mods: 'Reduce range. Keep chest on box.'
  }));
  parts.push(_nX({
    name: 'Ab Curl — Legs in Straps',
    badge: 'classical',
    purpose: 'Combines feet-in-straps leg work with abdominal curl. Prepares the client for Backstroke and Teaser on the Box.',
    placement: 'Feet in straps, hands can hold the sides of the box or reach forward.',
    setup: 'Supine on the long box, facing footbar, hips at front edge, legs in straps. Springs: 1 red.',
    cue: '"Legs press slightly, curl the head and chest up, reach the hands past the hips."',
    muscles: 'Rectus abdominis, obliques, hip flexors, hamstrings.',
    mods: 'Reduce curl height. Skip the leg press for beginners. Cervical support with the hands.'
  }));

  // SHORT BOX
  parts.push(_nSeries('Series 3 — Short Box'));
  parts.push(_nX({
    name: 'Short Box — Round Back',
    badge: 'classical',
    purpose: 'Trains abdominal control through a deep C-curve. Foundation of the entire Short Box series.',
    placement: 'Feet hooked under the foot strap, hands can cross over chest or reach forward.',
    setup: 'Short box placed across the carriage in front of the shoulder blocks. Seated on the box, feet under strap. Springs: 2 reds (heavy — carriage stabilized).',
    cue: '"Tuck the tailbone under. Roll back only as far as the abdominals can hold. Pull yourself home ribs-first."',
    muscles: 'Rectus abdominis, obliques, hip flexors.',
    mods: 'Reduce the roll-back distance. Keep hands on the box for balance.'
  }));
  parts.push(_nX({
    name: 'Short Box — Flat Back',
    badge: 'classical',
    purpose: 'Trains spinal extension and hip flexor strength.',
    placement: 'Feet under strap, hands overhead or crossed on chest.',
    setup: 'Same setup as Round Back.',
    cue: '"Long straight spine. Hinge back from the hips only as far as the back can stay flat. Return the same way."',
    muscles: 'Spinal extensors, hip flexors, quadriceps, deep abdominals.',
    mods: 'Reduce hinge angle. Hands on the hips for control.'
  }));
  parts.push(_nX({
    name: 'Short Box — Side to Side',
    badge: 'classical',
    purpose: 'Lateral trunk flexion under load. Trains obliques and quadratus lumborum.',
    placement: 'Feet under strap, arms overhead or hands lightly clasped behind the head.',
    setup: 'Same setup. Hinged back to a flat back position.',
    cue: '"Reach the arms up and over. Bend from the ribcage, not the hip. Return through center."',
    muscles: 'Obliques, quadratus lumborum, lateral spinal chain.',
    mods: 'Reduce range of lateral flexion. Hands on hips for beginners.'
  }));
  parts.push(_nX({
    name: 'Short Box — Twist',
    badge: 'classical',
    purpose: 'Spinal rotation under load.',
    placement: 'Feet under strap, hands behind head or crossed.',
    setup: 'Same setup, hinged back to flat back.',
    cue: '"Rotate from the ribcage. Pelvis stays square. Return through center before switching sides."',
    muscles: 'Obliques, spinal rotators, deep abdominals.',
    mods: 'Reduce rotation range. Pause at center between sides.'
  }));
  parts.push(_nX({
    name: 'Short Box — Tree',
    badge: 'classical',
    purpose: 'Hamstring stretch and spinal articulation. Signature Short Box finish.',
    placement: 'One foot under strap, other leg lifted and held with both hands.',
    setup: 'Same setup. One leg lifts, both hands walk up the leg toward the ankle.',
    cue: '"Walk the hands up the leg. Roll the spine back one bone at a time. Return by pulling with the abdominals."',
    muscles: 'Hamstrings, spinal flexors, hip flexors.',
    mods: 'Bend the lifted knee for tight hamstrings. Reduce the roll-back distance.'
  }));

  // ARMS IN STRAPS - Seated back rowing
  parts.push(_nSeries('Series 4 — Rowing (Seated Arms in Straps)'));
  parts.push(_nX({
    name: 'Seated Back Rowing — Low Row',
    badge: 'classical',
    purpose: 'Trains scapular depression and elbow flexion. Foundation for the full Rowing series.',
    placement: 'Hands in the arm straps. Feet flat against the shoulder blocks, legs extended in long sit.',
    setup: 'Seated on the carriage facing the footbar (feet toward the shoulder end). Springs: 1 red or 1 blue.',
    cue: '"Exhale, bend the elbows and draw the hands to the ribcage. Elbows stay behind you."',
    muscles: 'Latissimus, biceps, posterior deltoid, rhomboids, deep abdominals.',
    mods: 'Reduce spring for smaller clients. Keep spine tall for beginners.'
  }));
  parts.push(_nX({
    name: 'Seated Back Rowing — High Row',
    badge: 'classical',
    purpose: 'Same movement pattern with elbows lifted to shoulder height. Trains posterior deltoid.',
    placement: 'Same as Low Row.',
    setup: 'Same setup.',
    cue: '"Elbows lift to shoulder height. Hands frame the face. Exhale as you bend."',
    muscles: 'Posterior deltoid, rhomboids, upper trapezius (functional), latissimus.',
    mods: 'Reduce spring. Reduce elbow height.'
  }));
  parts.push(_nX({
    name: 'Seated Back Rowing — Biceps',
    badge: 'classical',
    purpose: 'Biceps isolation. Signature rowing variation.',
    placement: 'Hands in arm straps.',
    setup: 'Same setup.',
    cue: '"Elbows stay lifted at shoulder height. Bend the elbows and bring the hands toward the eyebrows."',
    muscles: 'Biceps brachii, brachialis, posterior deltoid.',
    mods: 'Reduce spring. Bring elbows slightly lower for shoulder restriction.'
  }));

  // ARMS IN STRAPS - kneeling front
  parts.push(_nSeries('Series 5 — Arms Facing Riser (Kneeling Front)'));
  parts.push(_nX({
    name: 'Kneeling Front — Serve a Tray',
    badge: 'classical',
    purpose: 'Trains scapular stability with arms extended forward. Kneeling adds balance challenge.',
    placement: 'Hands in the arm straps, arms straight out in front of the chest, palms up.',
    setup: 'Kneeling on the carriage facing the footbar, ankles pressed against the shoulder blocks. Springs: 1 blue or 1 red.',
    cue: '"Bend the elbows and bring the arms close to the ribs. Extend forward without letting the shoulders round."',
    muscles: 'Latissimus, biceps, mid trapezius, deep abdominals, hip extensors (kneeling stability).',
    mods: 'Place a pad under the knees. Sit back on the heels for beginners.'
  }));
  parts.push(_nX({
    name: 'Kneeling Front — Hug a Tree',
    badge: 'classical',
    purpose: 'Chest fly kneeling variation.',
    placement: 'Hands in straps, arms extended in front of the chest, palms facing each other.',
    setup: 'Same setup as Serve a Tray.',
    cue: '"Open the arms out to a T. Squeeze the chest to bring them home. Slight bend at the elbow."',
    muscles: 'Pectoralis major, anterior deltoid.',
    mods: 'Reduce range for shoulder restriction. Reduce spring for smaller clients.'
  }));
  parts.push(_nX({
    name: 'Kneeling Front — Salute',
    badge: 'classical',
    purpose: 'Overhead triceps extension.',
    placement: 'Hands in a diamond shape at the forehead.',
    setup: 'Same setup.',
    cue: '"From the diamond, extend the arms diagonally up and away. Elbows stay lifted."',
    muscles: 'Triceps brachii, deltoids, deep abdominals.',
    mods: 'Reduce spring. Do not attempt with active shoulder pain overhead.'
  }));

  // ARMS FACING FOOTBAR - chest expansion
  parts.push(_nSeries('Series 6 — Arms Facing Footbar (Kneeling Back)'));
  parts.push(_nX({
    name: 'Chest Expansion',
    badge: 'classical',
    purpose: 'Posterior arm extension against spring resistance. Opens the chest.',
    placement: 'Hands hold the arm straps, arms extended in front of the body.',
    setup: 'Kneeling on the carriage facing the pulleys (facing the shoulder blocks). Springs: 1 red.',
    cue: '"Exhale, pull the arms straight back to the hips. Look right, look left, look center. Release the arms forward."',
    muscles: 'Latissimus, posterior deltoid, triceps, deep abdominals.',
    mods: 'Reduce spring. Place a pad under the knees.'
  }));
  parts.push(_nX({
    name: 'Thigh Stretch',
    badge: 'classical',
    purpose: 'Full-body extension trainer. Combines quad stretch with anterior chain length.',
    placement: 'Hands hold the arm straps low, arms straight down alongside the body.',
    setup: 'Kneeling on the carriage facing the pulleys. Springs: 1 red.',
    cue: '"Hinge back from the knees as one piece. Do not break at the hips. Return by squeezing the seat."',
    muscles: 'Quadriceps, gluteals, spinal extensors, deep abdominals.',
    mods: 'Reduce hinge angle. Use only 1 blue spring for very small clients.'
  }));

  // KNEELING & STANDING PLANK SERIES
  parts.push(_nSeries('Series 7 — Plank Series'));
  parts.push(_nX({
    name: 'Knee Stretch — Round',
    badge: 'classical',
    purpose: 'Trains deep abdominal engagement in a rounded quadruped position. First exercise of the plank series.',
    placement: 'Hands on the footbar, shoulder-width. Knees on the carriage under the hips.',
    setup: 'Kneeling on the carriage, hands on footbar. Springs: 1 to 2 reds.',
    cue: '"Round the spine. Push the carriage back with the abdominals, pull it home with the abdominals."',
    muscles: 'Deep abdominals, latissimus, hip flexors.',
    mods: 'Reduce range. Reduce spring.'
  }));
  parts.push(_nX({
    name: 'Knee Stretch — Arched (Flat)',
    badge: 'classical',
    purpose: 'Same pattern in a neutral or slightly extended spine. Adds spinal extensor engagement.',
    placement: 'Same as Round.',
    setup: 'Same setup.',
    cue: '"Long spine, chest lifted. Push the carriage back with the seat, pull it home with the abdominals."',
    muscles: 'Spinal extensors, gluteals, deep abdominals.',
    mods: 'Reduce range. Beginner: alternate with Round to feel the difference.'
  }));
  parts.push(_nX({
    name: 'Front Splits',
    badge: 'classical',
    purpose: 'Hip flexor and hamstring flexibility. Stretch under spring resistance.',
    placement: 'Front foot on the footbar, back knee on the carriage.',
    setup: 'Kneeling on the carriage, one foot on the footbar. Springs: 1 red.',
    cue: '"Sink toward the front heel. Lift the chest. Back thigh reaches long."',
    muscles: 'Hip flexors, quadriceps, hamstrings.',
    mods: 'Pad under back knee. Reduce depth. Hold shoulder blocks for balance.'
  }));
  parts.push(_nX({
    name: 'Back Splits',
    badge: 'classical',
    purpose: 'Reverse of Front Splits. Deep hamstring stretch with quad engagement.',
    placement: 'Front foot on the footbar, back foot on the carriage.',
    setup: 'Standing lunge on the reformer. Springs: 1 red.',
    cue: '"Front leg presses long as the carriage moves away. Hips stay square."',
    muscles: 'Hamstrings, hip flexors, quadriceps.',
    mods: 'Reduce range. Hold the footbar for balance.'
  }));
  parts.push(_nX({
    name: 'Stomach Massage — Round',
    badge: 'classical',
    purpose: 'Seated footwork in a deep C-curve. Introduces upright abdominal-hip flexor coordination.',
    placement: 'Feet on the footbar in Pilates V, balls of the feet.',
    setup: 'Seated at the front edge of the carriage, spine in deep C-curve. Hands on the sides of the carriage. Springs: 2 to 3 reds.',
    cue: '"Round the spine. Press the feet out, keep the shape. Pull the carriage home with the abdominals."',
    muscles: 'Rectus abdominis, hip flexors, quadriceps.',
    mods: 'Reduce spring. Hold the sides of the carriage for support.'
  }));
  parts.push(_nX({
    name: 'Stomach Massage — Flat Back',
    badge: 'classical',
    purpose: 'Second variation. Trains spinal extension in a seated footwork position.',
    placement: 'Same as Round.',
    setup: 'Same setup. Spine now upright and long.',
    cue: '"Lift the chest, long tall spine. Press out and return without collapsing the back."',
    muscles: 'Spinal extensors, hip flexors, quadriceps.',
    mods: 'Reduce spring. Hold hands on the hips or reach forward for balance.'
  }));
  parts.push(_nX({
    name: 'Stomach Massage — Twist (Rotation)',
    badge: 'classical',
    purpose: 'Add rotation to the seated footwork. Trains oblique control under load.',
    placement: 'Same as above.',
    setup: 'Same setup. Arms lifted overhead or crossed.',
    cue: '"Press the carriage out. Rotate from the ribcage. Return through center."',
    muscles: 'Obliques, hip flexors, deep abdominals.',
    mods: 'Reduce rotation range. Slow the tempo.'
  }));

  return parts.join('\n');
}

// ============================================================================
// SECTION 4: ADVANCED REFORMER 2.0 LEVEL
// ============================================================================

function generateReformerLevel2Content() {
  const parts = [];
  parts.push(`<h2>Advanced Reformer 2.0 — Full Repertoire</h2>
<div class="level-intro">
<p>Level 2 is where the reformer becomes a full-body training instrument. These exercises demand precision, control, and body awareness developed through Levels 1 and 1.5. Do not teach these exercises to a client who cannot demonstrate clean neutral pelvis, clean spinal articulation, and confident spring management.</p>
<p>Every advanced exercise in this section requires spotting and clear verbal setup. When in doubt, cue louder and stand closer.</p>
</div>`);

  // ARMS IN STRAPS - Kneeling Side Arm Series
  parts.push(_nSeries('Series 1 — Kneeling Side Arm Series'));
  parts.push(_nX({
    name: 'Kneeling Side Arm — Internal Rotation',
    badge: 'classical',
    purpose: 'Isolate the shoulder internal rotators against light spring resistance. Foundational move of the side arm series.',
    placement: 'Kneel sideways on the carriage, closest hand holds the strap, elbow bent at 90 degrees.',
    setup: 'One knee down on the carriage, one knee lifted with foot on the carriage in a side-kneel. Free hand on hip. Springs: 1 blue or 1 red.',
    cue: '"Elbow stays glued to the ribs. Rotate the forearm across the body."',
    muscles: 'Subscapularis, pectoralis, deep abdominals, hip stabilizers.',
    mods: 'Reduce spring. Half-kneel instead of side-kneel for balance issues.'
  }));
  parts.push(_nX({
    name: 'Kneeling Side Arm — External Rotation',
    badge: 'classical',
    purpose: 'Opposite of internal rotation. Trains the rotator cuff externals.',
    placement: 'Far hand holds the strap, elbow at 90 degrees.',
    setup: 'Same side-kneel position.',
    cue: '"Elbow to the ribs. Forearm rotates away from the body."',
    muscles: 'Infraspinatus, teres minor, posterior deltoid.',
    mods: 'Reduce spring. Reduce range.'
  }));
  parts.push(_nX({
    name: 'Kneeling Side Arm — Overhead Press',
    badge: 'classical',
    purpose: 'Overhead shoulder press. Trains deltoid and scapular upward rotation.',
    placement: 'Closest hand to pulley holds the strap.',
    setup: 'Same side-kneel.',
    cue: '"Press the arm straight overhead. Ribs stay knit. Return with control."',
    muscles: 'Deltoids, upper trapezius, triceps, deep abdominals.',
    mods: 'Reduce range. Do not press overhead through pain.'
  }));
  parts.push(_nX({
    name: 'Kneeling Side Arm — Abduction',
    badge: 'classical',
    purpose: 'Full-body diagonal abduction pattern. Combines shoulder and trunk work.',
    placement: 'Far hand holds the strap.',
    setup: 'Same side-kneel.',
    cue: '"Sweep the hand from the opposite hip up diagonally to the same-side shoulder, then out to the side."',
    muscles: 'Deltoids, obliques, deep abdominals.',
    mods: 'Simplify to shoulder-only abduction for beginners.'
  }));
  parts.push(_nX({
    name: 'Kneeling Side Arm — Triceps',
    badge: 'classical',
    purpose: 'Overhead triceps extension in a side-kneel.',
    placement: 'Far hand holds the back strap.',
    setup: 'Same side-kneel.',
    cue: '"Elbow reaches for the ceiling. Extend the arm long. Return under control."',
    muscles: 'Triceps brachii, deep abdominals.',
    mods: 'Reduce range for tight shoulders. Do not attempt with cranky shoulders.'
  }));

  // SIDE LYING
  parts.push(_nSeries('Series 2 — Side Lying'));
  parts.push(_nX({
    name: 'Side-Lying Feet in Straps — Front &amp; Back',
    badge: 'classical',
    purpose: 'Trains hip flexion and extension in side-lying under spring resistance.',
    placement: 'Feet in straps, bottom arm long overhead as a pillow.',
    setup: 'Side-lying on the carriage, hips stacked, top leg in the strap. Springs: 1 blue or 1 red.',
    cue: '"Top leg reaches long forward, then long behind. Ribs stay stacked."',
    muscles: 'Hip flexors, hip extensors, gluteus medius, obliques.',
    mods: 'Head support with a pad. Reduce range.'
  }));
  parts.push(_nX({
    name: 'Side-Lying Feet in Straps — Up &amp; Down',
    badge: 'classical',
    purpose: 'Abduction under spring load.',
    placement: 'Same as above.',
    setup: 'Same side-lying setup.',
    cue: '"Lift the top leg to the ceiling, control the return. No hip rolling."',
    muscles: 'Gluteus medius, gluteus maximus, deep abdominals.',
    mods: 'Reduce spring. Bend bottom knee for stability.'
  }));

  // LONG BOX
  parts.push(_nSeries('Series 3 — Long Box (Advanced)'));
  parts.push(_nX({
    name: 'Hamstring Curl',
    badge: 'contemporary',
    purpose: 'Isolate the hamstrings against spring resistance. Contemporary addition, widely taught.',
    placement: 'Feet in small Velcro cuffs (or arm straps if cuffs are unavailable), one foot per cuff.',
    setup: 'Long box on carriage. Prone on the box facing footbar, hips over front edge, arms crossed in front of the box for support. Springs: 1 red.',
    cue: '"Exhale, bend the knees and curl the heels toward the seat. Pelvis stays stable."',
    muscles: 'Hamstrings, gluteals, deep abdominals.',
    mods: 'Do one leg at a time. Reduce spring for beginners.'
  }));
  parts.push(_nX({
    name: 'Breast Stroke (Full)',
    badge: 'classical',
    purpose: 'Full expression of Breast Stroke Prep. Adds thoracic extension.',
    placement: 'Hands in the arm straps, elbows bent at start.',
    setup: 'Prone on long box facing footbar. Springs: 1 blue.',
    cue: '"Exhale, sweep the arms overhead and lift the chest into extension. Inhale, circle the arms wide and lower with control."',
    muscles: 'Spinal extensors, gluteals, posterior deltoid, mid trapezius.',
    mods: 'Skip the thoracic extension for beginners.'
  }));
  parts.push(_nX({
    name: 'Backstroke',
    badge: 'classical',
    purpose: 'Combined abdominal, arm, and leg work in supine on the long box. One of the most demanding exercises in the repertoire.',
    placement: 'Hands in arm straps, feet in tabletop with knees over hips.',
    setup: 'Supine on the long box, facing the footbar, head at the front edge of the box, legs in tabletop. Springs: 1 blue.',
    cue: '"Curl the head and chest up into a diamond. Extend the arms and legs long. Circle around. Return."',
    muscles: 'Rectus abdominis, obliques, hip flexors, latissimus, triceps.',
    mods: 'Skip the leg or arm extension. Reduce curl height. Requires strong ab prep first.'
  }));
  parts.push(_nX({
    name: 'Teaser on the Box',
    badge: 'classical',
    purpose: 'Full-expression teaser on the long box. Trains full V-sit strength.',
    placement: 'Hands in arm straps, arms extended back overhead over the box.',
    setup: 'Supine on the long box facing footbar, legs resting actively on the edges of the box, footbar down. Springs: 1 blue.',
    cue: '"Sweep the arms around as the spine and hips lift into a V-sit. Arms and legs reach out. Articulate down."',
    muscles: 'Rectus abdominis, hip flexors, deep abdominals, latissimus.',
    mods: 'Reduce lift height. Bend the knees. Requires strong Ab Prep and Teaser Prep first.'
  }));
  parts.push(_nX({
    name: 'Pulling T-Straps',
    badge: 'classical',
    purpose: 'Advanced posterior chain. Combines Pulling Straps position with abduction.',
    placement: 'Hands in the arm straps, elbows soft at start.',
    setup: 'Prone on the long box facing the headrest. Perform Pulling Straps first. Springs: 1 red.',
    cue: '"Hold the thoracic extension. Inhale, sweep the arms straight out to a T. Exhale, adduct them back to the hips."',
    muscles: 'Posterior deltoid, mid trapezius, spinal extensors.',
    mods: 'Reduce range. Reduce spring for smaller clients.'
  }));

  // ROWING
  parts.push(_nSeries('Series 4 — Pilates Back Rowing'));
  parts.push(_nX({
    name: 'Pilates Back Rowing 1',
    badge: 'classical',
    purpose: 'Advanced seated rowing with spinal articulation. Combines abdominal scoop with arm sweep.',
    placement: 'Hands in the arm straps.',
    setup: 'Long sit on the carriage facing the headrest (feet toward the footbar). Springs: 1 blue.',
    cue: '"Inhale, prepare. Exhale, scoop into a deep C-curve and pull the hands to the breastbone. Inhale, extend the elbows. Exhale, flex forward, arms rotate behind, then sweep around into butterfly. Pause hands on shins. Return to long sit."',
    muscles: 'Rectus abdominis, latissimus, mid trapezius, hip flexors.',
    mods: 'Break the sequence into parts. Learn the C-curve scoop first, then add the arm sequence.'
  }));
  parts.push(_nX({
    name: 'Pilates Back Rowing 2',
    badge: 'classical',
    purpose: 'Rolling variation of Back Rowing. Trains articulated roll-down and lift.',
    placement: 'Hands in the arm straps.',
    setup: 'Same long sit setup. Springs: 1 blue.',
    cue: '"Inhale, bend the elbows. Exhale, roll down bringing the arms to the sides. Inhale, pause. Exhale, lift the body flexing at the hips, arms overhead. Lower arms back to long sit."',
    muscles: 'Abdominals, hip flexors, spinal flexors, latissimus.',
    mods: 'Reduce lift height. Requires excellent abdominal strength.'
  }));

  // STANDING / PLANK ADVANCED
  parts.push(_nSeries('Series 5 — Standing &amp; Plank (Advanced)'));
  parts.push(_nX({
    name: 'Long Stretch',
    badge: 'classical',
    purpose: 'Standing plank on the reformer. Foundation of the advanced plank series.',
    placement: 'Hands on the footbar, feet on the carriage against the shoulder blocks.',
    setup: 'Standing prone plank facing the springs. Springs: 1 to 2 reds.',
    cue: '"Long spine, one straight line from ears to heels. Push the carriage away with the shoulders. Pull it home the same way. No bounce."',
    muscles: 'Deep abdominals, shoulders, triceps, gluteals, hip flexors.',
    mods: 'Reduce range. Increase spring for more stability. Do not attempt if the client cannot hold a mat plank.'
  }));
  parts.push(_nX({
    name: 'Down Stretch',
    badge: 'classical',
    purpose: 'Plank series continuation. Trains spinal extension in the plank position.',
    placement: 'Hands on the footbar, knees on the carriage against the shoulder blocks.',
    setup: 'Kneeling on the carriage, hips lifted, spine in extension. Springs: 1 red.',
    cue: '"Chest lifts, hips press forward. Push and pull the carriage without breaking the shape."',
    muscles: 'Spinal extensors, hip flexors, quads, latissimus.',
    mods: 'Reduce range. Reduce spring. Requires clean Elephant first.'
  }));
  parts.push(_nX({
    name: 'Up Stretch',
    badge: 'classical',
    purpose: 'Full plank-to-pike transition. Trains transitions between spine extension, plank, and flexion.',
    placement: 'Hands on footbar, feet on the carriage.',
    setup: 'Standing prone plank. Springs: 1 red.',
    cue: '"From plank, push the carriage back and press the hips up into a pike. Return through plank. Elephant home."',
    muscles: 'Deep abdominals, latissimus, hip flexors, gluteals.',
    mods: 'Reduce the pike height. Break into two exercises for beginners.'
  }));
  parts.push(_nX({
    name: 'Long Back Stretch',
    badge: 'classical',
    purpose: 'Reverse plank on the reformer. One of the most demanding upper body exercises in the repertoire.',
    placement: 'Hands on the footbar behind the body, feet on the footbar.',
    setup: 'Seated on the carriage facing away from the footbar, reverse plank shape. Springs: 1 red.',
    cue: '"Press the carriage away from the footbar with straight arms. Pull it home. Hips stay lifted."',
    muscles: 'Triceps, shoulder extensors, deep abdominals, gluteals, hamstrings.',
    mods: 'Do not attempt with wrist injuries. Reduce range. Requires excellent shoulder stability.'
  }));
  parts.push(_nX({
    name: 'Control Balance',
    badge: 'classical',
    purpose: 'Prone plank with feet elevated on the footbar. Advanced plank variation.',
    placement: 'Hands on the shoulder blocks, feet on the footbar.',
    setup: 'Prone plank facing the headrest, feet on the footbar, hands on the shoulder rests. Springs: 1 red.',
    cue: '"Long spine, one straight line. Press from the shoulders to move the carriage away. Return with control."',
    muscles: 'Deep abdominals, shoulders, triceps, gluteals.',
    mods: 'Requires clean Long Stretch first. Do not attempt with shoulder impingement.'
  }));

  // SIDE ARM / STANDING SIDE
  parts.push(_nSeries('Series 6 — Standing Side / Mermaid'));
  parts.push(_nX({
    name: 'Mermaid',
    badge: 'classical',
    purpose: 'Seated lateral flexion and rotation with spring assistance.',
    placement: 'One hand on the footbar, legs folded in mermaid position or modified cross-legged.',
    setup: 'Seated sideways on the carriage. Springs: 1 red.',
    cue: '"Inhale, side bend as the arm reaches overhead. Exhale to straighten. Add rotation as flexibility increases."',
    muscles: 'Obliques, lateral trunk, quadratus lumborum.',
    mods: 'Modified cross-legged for tight hips. Reduce range.'
  }));
  parts.push(_nX({
    name: 'Side Split Series — Abduction',
    badge: 'classical',
    purpose: 'Standing abduction under spring load. Signature standing exercise on the reformer.',
    placement: 'One foot on the carriage, one foot on the sitting platform.',
    setup: 'Standing on the reformer, hands on hips or extended out to sides. Springs: start with 1 red, progress to 2 reds.',
    cue: '"Press both feet out equally. No pelvic tilt. Return by squeezing the inner thighs."',
    muscles: 'Adductors, abductors, gluteus medius, deep abdominals.',
    mods: 'Reduce spring. Reduce range. Hold the shoulder blocks with the hands for balance.'
  }));
  parts.push(_nX({
    name: 'Side Split Series — Adduction',
    badge: 'classical',
    purpose: 'Reverse of abduction. Trains adductor strength.',
    placement: 'Same as abduction.',
    setup: 'Same setup. Springs: 1 blue (adduction can even be done with no springs for advanced clients).',
    cue: '"Inhale, press out with both legs. Exhale, squeeze the inner thighs to pull the carriage back in."',
    muscles: 'Adductors, deep abdominals.',
    mods: 'Reduce range. Increase spring for beginners for more support.'
  }));

  // STANDING / SNAKE
  parts.push(_nSeries('Series 7 — Standing (Twist)'));
  parts.push(_nX({
    name: 'Twist (Snake)',
    badge: 'classical',
    purpose: 'The most advanced standing exercise in the classical repertoire. Combines rotation, extension, and full-body control.',
    placement: 'One hand on the far shoulder rest, opposite hand on the back edge of the carriage. Feet crossed on the footbar.',
    setup: 'Stand facing the reformer. Place the left hand on the far shoulder rest, right foot on the footbar. Place the right hand on the back edge of the carriage near the springs. Cross the left foot over the right. Hips piked, head down. Springs: 1 red.',
    cue: '"Inhale, press the carriage away. Exhale, engage the abdominals to pike the hips home. Never attempt without a spotter."',
    muscles: 'Obliques, shoulders, deep abdominals, spinal rotators.',
    mods: '<strong>Do not attempt without an experienced spotter.</strong> Requires clean Long Stretch, Mermaid, and Side Split Series first.'
  }));

  return parts.join('\n');
}

// ============================================================================
// SECTION 5: JUMPBOARD
// ============================================================================

function generateReformerJumpboardContent() {
  const parts = [];
  parts.push(`<h2>Jumpboard — Horizontal Cardio Training</h2>
<div class="level-intro">
<p>The jumpboard turns the reformer into a horizontal cardio trampoline. Because the body is supine and the spring absorbs impact, jumpboard delivers cardiovascular training with virtually no joint compression. It is the closest thing Pilates has to plyometric training.</p>
<p><strong>Universal rules:</strong></p>
<ul>
<li>Land toe-ball-heel every single jump. Never flat-footed.</li>
<li>Always land with a slightly bent knee. Never lock out.</li>
<li>Pelvis stays neutral or lightly imprinted. Never let the low back arch away from the carriage.</li>
<li>Springs: 2 to 3 reds for most exercises. Adjust for client size.</li>
<li>Do not teach jumpboard to a client who has not mastered footwork.</li>
</ul>
</div>`);

  parts.push(_nSeries('Series 1 — Foundation Jumps'));
  parts.push(_nX({
    name: 'Parallel Jumps — Feet Together',
    badge: 'contemporary',
    purpose: 'The first jump. Establishes rhythm, landing mechanics, and spring timing.',
    placement: 'Feet parallel and together in the middle of the board.',
    setup: 'Supine on the carriage, head on headrest, arms by sides. Springs: 2 to 3 reds.',
    cue: '"Toe, ball, heel every time. Push off both feet equally. Land soft."',
    muscles: 'Quadriceps, gluteals, calves, deep abdominals.',
    mods: 'Reduce spring for beginners. Reduce range of jump. Short sets to build the pattern.'
  }));
  parts.push(_nX({
    name: 'Parallel Jumps — Feet Apart',
    badge: 'contemporary',
    purpose: 'Widen the base. Adds inner thigh stabilization.',
    placement: 'Feet parallel, hip-distance or slightly wider.',
    setup: 'Same supine setup.',
    cue: '"Track knees over second toes. Same soft landing."',
    muscles: 'Quadriceps, gluteals, adductors.',
    mods: 'Reduce spring. Reduce jump height.'
  }));
  parts.push(_nX({
    name: 'Turn Out Jumps — Feet Together',
    badge: 'contemporary',
    purpose: 'Classical Pilates V under jump load. Trains external rotators.',
    placement: 'Heels together in Pilates V, balls of the feet in a small turn out.',
    setup: 'Same setup.',
    cue: '"Squeeze the heels together at the top of each jump."',
    muscles: 'Quads, gluteals, adductors, deep external rotators.',
    mods: 'Reduce jump height for stiff hips.'
  }));
  parts.push(_nX({
    name: 'Turn Out Jumps — Feet Apart',
    badge: 'contemporary',
    purpose: 'Wide second position with turnout.',
    placement: 'Feet wider than hip-distance, small turnout.',
    setup: 'Same setup.',
    cue: '"Track knees over pinky toes. Land soft."',
    muscles: 'Quads, gluteals, adductors, external rotators.',
    mods: 'Reduce range.'
  }));

  parts.push(_nSeries('Series 2 — Coordination Jumps'));
  parts.push(_nX({
    name: 'Single Leg Jumps',
    badge: 'contemporary',
    purpose: 'One leg trains balance and strength unilaterally. Reveals side dominance instantly.',
    placement: 'One foot in the middle of the board, other leg extended or in tabletop.',
    setup: 'Same supine setup. Springs: 2 reds.',
    cue: '"Same toe-ball-heel. Non-jumping leg stays still."',
    muscles: 'Full lower body of the working leg, deep abdominals.',
    mods: 'Reduce spring. Rest between sides. Alternate between legs mid-set.'
  }));
  parts.push(_nX({
    name: 'Prancing (Alternating Feet)',
    badge: 'contemporary',
    purpose: 'Trains alternating leg mechanics like running in place.',
    placement: 'Feet parallel, hip-distance.',
    setup: 'Same setup.',
    cue: '"One heel presses down as the other lifts. Even, rhythmic, no bouncing pelvis."',
    muscles: 'Calves, quadriceps, gluteals, deep abdominals.',
    mods: 'Slow the tempo. Reduce spring.'
  }));
  parts.push(_nX({
    name: 'Skiing (Both Feet Side to Side)',
    badge: 'contemporary',
    purpose: 'Adds lateral movement to the jump. Trains oblique and hip stabilizer coordination.',
    placement: 'Feet together.',
    setup: 'Same supine setup.',
    cue: '"Both feet land right, both feet land left. Head stays still on the headrest."',
    muscles: 'Obliques, gluteus medius, adductors.',
    mods: 'Reduce lateral range. Reduce spring.'
  }));
  parts.push(_nX({
    name: 'Kicking (Alternating Front Kick)',
    badge: 'contemporary',
    purpose: 'Adds front kick to alternate legs. Builds hip flexor stamina.',
    placement: 'One foot on the board, other kicks toward the ceiling.',
    setup: 'Same setup.',
    cue: '"Kick straight up, then land with a soft knee."',
    muscles: 'Hip flexors, quads, gluteals, deep abdominals.',
    mods: 'Reduce kick height. Rest between sides.'
  }));

  parts.push(_nSeries('Series 3 — Advanced Jumps'));
  parts.push(_nX({
    name: 'Wide-to-Narrow Jumps',
    badge: 'contemporary',
    purpose: 'Combines Parallel Apart and Parallel Together in one set. Coordination challenge.',
    placement: 'Feet alternate wide and narrow.',
    setup: 'Same setup.',
    cue: '"Land wide, land narrow. Alternate every jump."',
    muscles: 'Adductors, abductors, quads, gluteals.',
    mods: 'Slow the tempo. Reduce range.'
  }));
  parts.push(_nX({
    name: 'Jumping Jacks',
    badge: 'contemporary',
    purpose: 'Combines lateral movement with arm coordination.',
    placement: 'Feet parallel together, arms alongside body or lifted.',
    setup: 'Same setup.',
    cue: '"Feet jump apart, arms sweep out. Feet together, arms return. Land soft."',
    muscles: 'Quads, gluteals, adductors, shoulders.',
    mods: 'Skip the arm movement to focus on legs. Reduce range.'
  }));
  parts.push(_nX({
    name: 'Twist Jumps (Rotation)',
    badge: 'contemporary',
    purpose: 'Rotational jump. Trains oblique control under impact.',
    placement: 'Feet together, knees rotate side to side while feet stay parallel.',
    setup: 'Same setup, knees in tabletop before starting.',
    cue: '"Rotate the knees to the right on landing, then to the left. Ribs stay knit."',
    muscles: 'Obliques, deep abdominals, adductors.',
    mods: 'Reduce rotation range. Slow the tempo.'
  }));
  parts.push(_nX({
    name: 'Single Leg Turn Out',
    badge: 'contemporary',
    purpose: 'Single-leg jump with turnout. Advanced coordination.',
    placement: 'One foot on the board, turned out.',
    setup: 'Same supine setup. Springs: 2 reds.',
    cue: '"Same soft landing. Non-jumping leg stays turned out and still."',
    muscles: 'Quads, gluteals, external rotators.',
    mods: 'Reduce range. Rest often.'
  }));
  parts.push(_nX({
    name: 'Jumps with Ab Curl',
    badge: 'contemporary',
    purpose: 'Combines jump with abdominal curl. Trains simultaneous upper and lower body work.',
    placement: 'Feet parallel, hands behind head.',
    setup: 'Same supine setup. Headrest up.',
    cue: '"Curl the head and chest up as the feet jump out. Return together."',
    muscles: 'Rectus abdominis, hip flexors, quads.',
    mods: 'Keep the head down for cervical issues. Reduce jump range.'
  }));
  parts.push(_nX({
    name: 'Long Leg Jumps (Straight Leg)',
    badge: 'contemporary',
    purpose: 'Jump with legs at 45 or 90 degrees. Advanced hip flexor and abdominal challenge.',
    placement: 'Feet at 45 degrees or higher.',
    setup: 'Springs: 2 reds. Legs are straight throughout the jump.',
    cue: '"Legs jump like scissors — no bending at the knees."',
    muscles: 'Hip flexors, quadriceps, deep abdominals.',
    mods: 'Reduce leg height (start at 90 degrees). Keep sets short.'
  }));

  return parts.join('\n');
}

// ============================================================================
// SECTION 6: CLASS FLOWS
// ============================================================================

function generateClassFlowsContent() {
  return `<h2>Three Example Class Flows</h2>
<p>These flows demonstrate how the classical sequence progresses across levels. Each flow starts with footwork, includes a plank/kneeling series, and ends with feet in straps for restorative closure.</p>

<div class="class-flow">
<h4>Class 1: Level 1 Foundation Flow (45 minutes)</h4>
<div class="class-flow-step"><span class="class-flow-num">1</span><div><strong>Footwork Series (Classical)</strong> — 3 to 4 reds. Toes, Arches, Heels, Tendon Stretch, Running (10 reps each). <em>10 min</em>. Cue: "Press evenly through both feet. Neutral pelvis."</div></div>
<div class="class-flow-step"><span class="class-flow-num">2</span><div><strong>Ab Prep</strong> — 2 reds with footbar. 8 reps. <em>3 min</em>. Cue: "Ribs to hips. Eyes to belly button."</div></div>
<div class="class-flow-step"><span class="class-flow-num">3</span><div><strong>Arm Circle Series (Supine)</strong> — 1 blue. Lower &amp; lift, circles, triceps press. 5 reps each. <em>5 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">4</span><div><strong>Lunge (Kneeling Runner)</strong> — 1 red. 6 reps each side. <em>5 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">5</span><div><strong>Elephant</strong> — 1 to 2 reds. 8 reps. <em>4 min</em>. Cue: "Push with the abs, pull with the abs."</div></div>
<div class="class-flow-step"><span class="class-flow-num">6</span><div><strong>Breast Stroke Prep (Long Box)</strong> — 1 blue. 6 reps. <em>4 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">7</span><div><strong>Pelvic Lift Prep</strong> — 2 to 3 reds. 6 reps. <em>3 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">8</span><div><strong>Feet in Straps — Frogs &amp; Circles</strong> — 1 red. 8 reps frogs, 5 circles each direction. <em>7 min</em>. Cue: "Pelvis stays glued to the carriage."</div></div>
<div class="class-flow-step"><span class="class-flow-num">9</span><div><strong>Seated Forward Fold Closure</strong> — 1 blue. 3 breaths. <em>4 min</em>.</div></div>
</div>

<div class="class-flow">
<h4>Class 2: Level 1.5 Intermediate Flow (55 minutes)</h4>
<div class="class-flow-step"><span class="class-flow-num">1</span><div><strong>Footwork — Full Classical + Wide Second</strong> — 3 to 4 reds. <em>10 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">2</span><div><strong>The Hundred</strong> — 1 red. Full expression, legs at 45. <em>3 min</em>. Cue: "Long past the hips. Ribs heavy."</div></div>
<div class="class-flow-step"><span class="class-flow-num">3</span><div><strong>Coordination</strong> — 1 red. 8 reps. <em>3 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">4</span><div><strong>Seated Back Rowing — Low, High, Biceps</strong> — 1 red. 6 reps each. <em>7 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">5</span><div><strong>Long Box: Pulling Straps 1 &amp; 2</strong> — 1 red. 6 reps each. <em>5 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">6</span><div><strong>Short Box: Round, Flat, Side-to-Side, Twist, Tree</strong> — 2 reds (carriage stable). Full series. <em>10 min</em>. Cue: "Feet anchored. Move from the ribcage."</div></div>
<div class="class-flow-step"><span class="class-flow-num">7</span><div><strong>Kneeling Front Series (Serve a Tray, Hug a Tree, Salute)</strong> — 1 red. 6 reps each. <em>5 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">8</span><div><strong>Chest Expansion &amp; Thigh Stretch</strong> — 1 red. 6 reps each. <em>4 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">9</span><div><strong>Knee Stretch — Round &amp; Flat</strong> — 2 reds. Plank series entry. <em>3 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">10</span><div><strong>Stomach Massage — Round &amp; Flat Back</strong> — 3 reds. 6 reps each. <em>4 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">11</span><div><strong>Feet in Straps — Long Spine &amp; Short Spine</strong> — 1 red + 1 blue. 3 reps each. <em>5 min</em>. Spot each rep.</div></div>
</div>

<div class="class-flow">
<h4>Class 3: Level 2 Advanced Flow (60 minutes)</h4>
<div class="class-flow-step"><span class="class-flow-num">1</span><div><strong>Footwork — Full + Single Leg</strong> — 3 to 4 reds. <em>10 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">2</span><div><strong>Hundred — Full Expression</strong> — 1 red. <em>2 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">3</span><div><strong>Coordination + Backstroke Prep</strong> — 1 blue. 8 reps each. <em>4 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">4</span><div><strong>Pilates Back Rowing 1 &amp; 2</strong> — 1 blue. 3 reps each sequence. <em>7 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">5</span><div><strong>Long Box: Pulling Straps → T-Straps → Breast Stroke → Backstroke → Teaser on the Box</strong> — 1 blue for most, 1 red for pulling straps. <em>10 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">6</span><div><strong>Short Box: Full Series + Around the World</strong> — 2 reds. <em>7 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">7</span><div><strong>Kneeling Side Arm Series (Full 5 variations)</strong> — 1 blue. <em>6 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">8</span><div><strong>Plank Series: Long Stretch → Down Stretch → Up Stretch → Long Back Stretch → Control Balance</strong> — 1 red. <em>7 min</em>.</div></div>
<div class="class-flow-step"><span class="class-flow-num">9</span><div><strong>Standing: Mermaid, Side Splits (Ab &amp; Ad), Snake/Twist</strong> — 1 to 2 reds. <em>5 min</em>. Spot Snake every time.</div></div>
<div class="class-flow-step"><span class="class-flow-num">10</span><div><strong>Feet in Straps — Long Spine, Short Spine, Circles</strong> — 1 red. Closure. <em>2 min</em>.</div></div>
</div>

<h3>How to Sequence Your Own Class</h3>
<p>Every well-built reformer class follows the same shape:</p>
<ol>
<li><strong>Footwork opener</strong> — warms the body, connects to breath, establishes neutral pelvis.</li>
<li><strong>Supine core work</strong> — Hundred, Coordination, ab prep patterns.</li>
<li><strong>Seated or rowing series</strong> — introduces upper body strength.</li>
<li><strong>Long Box</strong> — prone extension and supine advanced work.</li>
<li><strong>Short Box</strong> — seated abdominal, side, and rotation work.</li>
<li><strong>Kneeling series</strong> — arms and thigh stretch.</li>
<li><strong>Plank / standing</strong> — the strength climax of class.</li>
<li><strong>Stomach Massage or feet in straps</strong> — seated or supine closure.</li>
<li><strong>Stretch and finish</strong> — hamstring stretch, side splits, or breath.</li>
</ol>
<p><strong>Pacing rule of thumb:</strong> Match spring changes to natural transitions. Never make a client hold a spring change during exertion. Keep talking. Cue the next setup while they finish the last rep.</p>
`;
}


// ===== QUIZ GENERATORS =====

function generateModule1Quiz() {
  return [
    { q: "In what year was Joseph Pilates born?", opts: ["1879", "1883", "1890", "1895"], correct: 1 },
    { q: "What did Joseph Pilates originally call his method?", opts: ["Pilates Method", "Body Conditioning", "Contrology", "Movement Science"], correct: 2 },
    { q: "Where did Pilates open his New York studio?", opts: ["Broadway", "Fifth Avenue", "Eighth Avenue", "Park Avenue"], correct: 2 },
    { q: "Who took over the Pilates studio when Clara retired?", opts: ["Ron Fletcher", "Romana Kryzanowska", "Eve Gentry", "Kathy Grant"], correct: 1 },
    { q: "Which principle refers to movement originating from the core?", opts: ["Concentration", "Control", "Centering", "Flow"], correct: 2 },
    { q: "How many apparatuses did Joseph Pilates patent in his lifetime?", opts: ["12", "18", "26", "34"], correct: 2 },
    { q: "Which Elder developed 'Pre-Pilates' movements?", opts: ["Romana Kryzanowska", "Ron Fletcher", "Eve Gentry", "Carola Trier"], correct: 2 },
    { q: "Which of these is NOT one of the Six Principles?", opts: ["Precision", "Flexibility", "Flow", "Breath"], correct: 1 },
    { q: "Ron Fletcher is famous for developing which signature element?", opts: ["Pre-Pilates", "Percussive breath", "Caesarean abs", "Clock exercise and percussive breath"], correct: 3 },
    { q: "Which book contains the original 34 mat exercises?", opts: ["Your Health", "Return to Life Through Contrology", "The Pilates Method", "Body Conditioning Manual"], correct: 1 },
    { q: "What is 'Classical Pilates' most closely associated with?", opts: ["A single contemporary school", "Modern biomechanics research", "Romana Kryzanowska's lineage and the original sequence", "Polestar rehabilitation"], correct: 2 },
    { q: "Contemporary Pilates approaches focus primarily on:", opts: ["Maximum flexibility only", "Restoring natural curves of the spine and integrating modern biomechanics", "Imprinted spine at all times", "High-intensity training"], correct: 1 },
    { q: "How many principles does the contemporary approach teach (building on the original six)?", opts: ["3", "5", "6", "8"], correct: 1 },
    { q: "BASI Pilates was founded by:", opts: ["Romana Kryzanowska", "Nora St. John", "Rael Isacowitz", "Ron Fletcher"], correct: 2 },
    { q: "Clara Pilates was originally trained as a:", opts: ["Dancer", "Nurse", "Kindergarten teacher", "Physical therapist"], correct: 2 },
    { q: "Which best describes the difference between Classical and Contemporary Pilates?", opts: ["Contemporary abandons the principles", "Classical is for beginners, contemporary for advanced", "Classical preserves the original sequence; contemporary integrates modern rehabilitation science", "They are identical"], correct: 2 },
    { q: "Polestar Pilates was co-founded by:", opts: ["Romana Kryzanowska", "Brent Anderson and Elizabeth Larkam", "Rael Isacowitz", "Eve Gentry"], correct: 1 }
  ];
}

function generateModule2Quiz() {
  return [
    { q: "Which four muscles form the Core Cylinder?", opts: ["Rectus abdominis, obliques, glutes, lats", "TVA, multifidus, pelvic floor, diaphragm", "Erector spinae, QL, psoas, rectus", "Obliques, TVA, glutes, hamstrings"], correct: 1 },
    { q: "The TVA fibres run in which direction?", opts: ["Vertical", "Diagonal", "Horizontal", "Oblique"], correct: 2 },
    { q: "Which muscle does NOT spontaneously recover after acute LBP?", opts: ["Rectus abdominis", "Erector spinae", "Multifidus", "External obliques"], correct: 2 },
    { q: "The scapulohumeral rhythm ratio is:", opts: ["1:1", "3:1", "2:1", "1:2"], correct: 2 },
    { q: "Which spinal region has the least rotational capacity?", opts: ["Cervical", "Thoracic", "Lumbar", "Sacral"], correct: 2 },
    { q: "In neutral pelvis, the ASIS and pubic symphysis are in the same:", opts: ["Horizontal plane", "Vertical plane", "Sagittal plane", "Transverse plane"], correct: 1 },
    { q: "The 'Deep Front Line' in fascial anatomy includes which muscle?", opts: ["Gluteus maximus", "Latissimus dorsi", "Iliopsoas", "Biceps femoris"], correct: 2 },
    { q: "Which joint primarily needs STABILITY according to the Joint-by-Joint concept?", opts: ["Hip", "Thoracic spine", "Lumbar spine", "Ankle"], correct: 2 },
    { q: "Lateral thoracic breathing in Pilates involves:", opts: ["Belly breathing only", "Chest breathing only", "Expanding ribcage in all directions while maintaining abdominal engagement", "Holding breath during exertion"], correct: 2 },
    { q: "The SITS muscles refer to the:", opts: ["Core cylinder", "Rotator cuff", "Deep hip rotators", "Scapular stabilizers"], correct: 1 },
    { q: "What is the primary function of the pelvic floor in the core cylinder?", opts: ["Spinal extension", "Hip flexion", "Floor of the pressure system; support of pelvic organs", "Lateral flexion"], correct: 2 },
    { q: "A force couple produces:", opts: ["Linear motion", "Rotation without translation", "Translation without rotation", "Compression"], correct: 1 },
    { q: "Which structure is the 'roof' of the core cylinder?", opts: ["TVA", "Pelvic floor", "Multifidus", "Diaphragm"], correct: 3 },
    { q: "The psoas muscle originates from which vertebrae?", opts: ["C1–C7", "T1–T6", "T12–L5", "L5–S1"], correct: 2 },
    { q: "Open kinetic chain means:", opts: ["Feet are fixed to a stable surface", "The distal segment moves freely in space", "Both hands are on the ground", "Springs provide resistance"], correct: 1 },
    { q: "In an imprinted spine position:", opts: ["Lumbar lordosis is exaggerated", "The spine is in neutral", "Lumbar spine is gently pressed toward the mat", "Thoracic kyphosis is increased"], correct: 2 },
    { q: "The serratus anterior prevents:", opts: ["Hip drop", "Knee valgus", "Scapular winging", "Lumbar hyperextension"], correct: 2 },
    { q: "Fascia is primarily composed of:", opts: ["Muscle fibers", "Cartilage", "Collagen and elastin fibres", "Synovial fluid"], correct: 2 },
    { q: "The gluteus medius is critical for:", opts: ["Hip extension", "Hip flexion", "Pelvic stabilization in single-leg stance", "Spinal rotation"], correct: 2 },
    { q: "Nucleus pulposus migrates posteriorly during which spinal movement?", opts: ["Extension", "Flexion", "Lateral flexion", "Rotation"], correct: 1 },
    { q: "In a closed chain exercise, which statement is TRUE?", opts: ["The distal segment (hand or foot) moves freely in space", "The distal segment is fixed against a stable surface", "Both hands must be on the floor", "Springs provide all the resistance"], correct: 1 },
    { q: "Which of these is an OPEN chain exercise?", opts: ["Reformer footwork (feet on footbar)", "Push-up with hands on mat", "Feet-in-straps leg circles", "Squat with feet on platform"], correct: 2 },
    { q: "Why are closed chain exercises generally preferred in early rehabilitation?", opts: ["They are easier to teach", "They provide more joint stability and recruit more muscles simultaneously", "They require less equipment", "They burn more calories"], correct: 1 }
  ];
}

function generateModule3Quiz() {
  return [
    { q: "How many mat exercises are in the original 'Return to Life' sequence?", opts: ["28", "30", "34", "40"], correct: 2 },
    { q: "The Hundred involves how many arm pumps?", opts: ["50", "80", "100", "120"], correct: 2 },
    { q: "Which exercise is described as 'the classical opening warm-up'?", opts: ["Roll Up", "The Hundred", "Rolling Like a Ball", "Single Leg Stretch"], correct: 1 },
    { q: "What is the Pilates 'Powerhouse'?", opts: ["The reformer machine", "Upper body muscles", "Lower abdominals, pelvic floor, hip flexors, glutes, lower back", "The shoulder girdle"], correct: 2 },
    { q: "The Teaser primarily challenges:", opts: ["Hamstring flexibility", "Full core integration and balance", "Shoulder stability", "Hip external rotation"], correct: 1 },
    { q: "Which is the final exercise in the classical mat sequence?", opts: ["The Seal", "Control Balance", "The Push Up", "Rocking"], correct: 2 },
    { q: "The Swan-Dive primarily targets:", opts: ["Abdominals", "Hip flexors", "Spinal extensors and glutes", "Adductors"], correct: 2 },
    { q: "In Rolling Like a Ball, you should roll back to:", opts: ["The neck", "The shoulder blades", "The lower back only", "The head"], correct: 1 },
    { q: "Side Kick Series is primarily performed in which position?", opts: ["Supine", "Prone", "Side-lying", "Standing"], correct: 2 },
    { q: "The Magic Circle was originally fashioned from:", opts: ["A bicycle wheel", "A wine keg ring", "A steel hoop", "A rubber band"], correct: 1 },
    { q: "Placing the overball between the knees primarily activates:", opts: ["Hip abductors", "Hip adductors and pelvic floor", "Quadriceps", "Hamstrings"], correct: 1 },
    { q: "How many Magic Circle exercises are covered in this module?", opts: ["15", "20", "23", "25"], correct: 2 },
    { q: "In Sculpt Pilates, the typical rep range is:", opts: ["3–5 per exercise", "6–8 per exercise", "12–20+ per set", "50+ per exercise"], correct: 2 },
    { q: "Which level includes the Boomerang and Control Balance?", opts: ["Basic", "Intermediate", "Advanced", "Pre-Pilates"], correct: 2 },
    { q: "The Roll Up's primary error to watch for is:", opts: ["Holding breath", "Using momentum instead of articulation", "Over-rotating", "Knee hyperextension"], correct: 1 },
    { q: "The Spine Twist's movement originates from:", opts: ["The shoulders", "The arms", "The waist (torso rotation)", "The hips"], correct: 2 },
    { q: "Swimming exercise uses which breathing pattern?", opts: ["Hold breath throughout", "Inhale 5, exhale 5 counts", "One breath per rep", "No specific pattern"], correct: 1 },
    { q: "The Overball placed under the sacrum creates:", opts: ["Support for the lumbar spine", "Instability demanding deeper abdominal engagement", "Thoracic extension", "Hip flexor stretch"], correct: 1 },
    { q: "Which mat exercise links the sequence back to standing?", opts: ["The Seal", "The Boomerang", "The Push Up", "Control Balance"], correct: 2 },
    { q: "In the Double Leg Stretch, arms circle:", opts: ["Forward only", "Backward only", "Wide around and hug knees back to chest", "Side to side"], correct: 2 },
    { q: "What key Pilates principle does the Hundred primarily develop?", opts: ["Precision", "Flow between exercises", "Breath coordination and core endurance", "Flexibility"], correct: 2 },
    { q: "The Side Bend (Mermaid) primarily strengthens:", opts: ["Hip extensors", "Obliques and lateral trunk", "Spinal extensors", "Pectorals"], correct: 1 },
    { q: "Which of these is a Sculpt Pilates class component?", opts: ["Fixed classical mat order", "Standing lower body series with dumbbells", "Apparatus work on Cadillac", "Hot room environment"], correct: 1 },
    { q: "The Neck Pull is described as a harder version of:", opts: ["The Hundred", "The Roll Up", "The Teaser", "The Jackknife"], correct: 1 },
    { q: "Overball exercises include how many variations in total?", opts: ["15", "18", "21", "25"], correct: 2 }
  ];
}

function generateModule4Quiz() {
  return [
    { q: "How many springs does the classical Footwork series typically use?", opts: ["1", "2", "3", "4"], correct: 3 },
    { q: "The Reformer was inspired by springs attached to:", opts: ["Gym equipment", "Hospital beds", "Dance barres", "Boxing rings"], correct: 1 },
    { q: "In the Feet in Straps series, 'Frogs' primarily target:", opts: ["Spinal extensors", "Hip flexors/extensors and adductors", "Shoulder girdle", "Calves"], correct: 1 },
    { q: "Which exercise is performed on the Long Box in prone position?", opts: ["Backstroke", "Short Box Round", "Pull Straps", "Coordination"], correct: 2 },
    { q: "The headrest should be positioned DOWN for:", opts: ["Flexion exercises", "Extension and supine exercises", "Footwork", "Seated exercises"], correct: 1 },
    { q: "Knee Stretches — Knees Off requires the knees to hover:", opts: ["6 inches", "3 inches", "1 inch", "On a block"], correct: 2 },
    { q: "Chest Expansion on the reformer involves looking:", opts: ["Down at feet", "Straight ahead only", "Right, left, then center", "Up at ceiling"], correct: 2 },
    { q: "Short Spine Massage ends with:", opts: ["Articulating the spine back down", "A jump", "Rolling to side-lying", "Standing up"], correct: 0 },
    { q: "The Elephant exercise is performed in which position?", opts: ["Supine", "Prone on box", "Standing on carriage, hands on footbar", "Kneeling"], correct: 2 },
    { q: "A RED spring on a contemporary reformer indicates:", opts: ["Light resistance", "Medium resistance", "Heavy resistance", "No resistance"], correct: 2 },
    { q: "The Rowing series is typically performed with:", opts: ["4 springs", "3 springs", "1–2 springs", "No springs"], correct: 2 },
    { q: "Side Splits primarily target:", opts: ["Spinal extensors", "Adductors (inner thighs)", "Shoulder girdle", "Hip flexors"], correct: 1 },
    { q: "Which is NOT a safety protocol for the reformer?", opts: ["Check spring attachment before starting", "Never step on carriage without springs", "Always use maximum spring resistance", "Watch for pinch points"], correct: 2 },
    { q: "Long Stretch is essentially a:", opts: ["Bridge", "Side plank", "Moving plank", "Swan"], correct: 2 },
    { q: "A Beginner Class Flow should last approximately:", opts: ["30 minutes", "45 minutes", "60 minutes", "75 minutes"], correct: 1 },
    { q: "In the Advanced Class Flow, which exercise follows the Overhead?", opts: ["Footwork", "Coordination", "Running", "Side Splits"], correct: 1 },
    { q: "The Semi-Circle exercise combines:", opts: ["Arm work and leg work", "Bridge and extension with spinal articulation", "Rolling and balance", "Jumping and landing"], correct: 1 },
    { q: "Running on the reformer uses how many springs?", opts: ["1", "2", "3–4", "All springs"], correct: 2 },
    { q: "Short Box — Tree involves:", opts: ["Full plank on the box", "Walking hands up an extended leg", "Standing on the box", "Rolling the box on the carriage"], correct: 1 },
    { q: "Every example class flow ends with:", opts: ["Footwork", "Short Box series", "Feet in straps", "Stretching on the mat"], correct: 2 },
    { q: "Pull Straps 2 (T Pull) primarily targets:", opts: ["Chest and anterior deltoids", "Lower/mid trapezius and rhomboids", "Biceps", "Hip flexors"], correct: 1 },
    { q: "Thigh Stretch is performed in which position?", opts: ["Supine", "Prone", "Kneeling upright", "Standing"], correct: 2 },
    { q: "The Coordination exercise sequence is:", opts: ["Extend arms, extend legs, open, close, bend, return", "Extend legs, bend arms, rotate, return", "Circle arms, extend legs, close", "Press out, hold, return"], correct: 0 },
    { q: "Backstroke on the Long Box is performed:", opts: ["Prone", "Supine", "Side-lying", "Seated"], correct: 1 },
    { q: "Which is the most advanced variation of Knee Stretches?", opts: ["Round", "Arched", "Knees Off", "Single leg"], correct: 2 },
    { q: "The Snake/Twist exercise on the reformer involves the spine moving through:", opts: ["Only flexion", "Only extension", "Flexion, extension, and rotation in one fluid motion", "Only lateral flexion"], correct: 2 },
    { q: "In the Stomach Massage Round, the spine position is:", opts: ["Flat back / neutral", "Extended (backbend)", "Deep C-curve (rounding forward)", "Rotated to one side"], correct: 2 },
    { q: "The Scooter/Skating exercise on the reformer primarily challenges:", opts: ["Upper body pushing strength", "Bilateral leg symmetry", "Single-leg stability and glute/hamstring strength", "Spinal rotation"], correct: 2 },
    { q: "The Pelvic Lift / Bridge on the Reformer is typically performed with:", opts: ["Hands in straps", "Feet on the footbar", "Side-lying position", "Seated on the box"], correct: 1 },
    { q: "Reformer footwork is classified as which type of kinetic chain exercise?", opts: ["Open chain — feet move freely", "Closed chain — feet are fixed on the footbar", "Neither — springs remove the classification", "Open chain when springs are light, closed when heavy"], correct: 1 },
    { q: "Which of these reformer exercises involves BOTH hands AND feet fixed simultaneously?", opts: ["Rowing series", "Elephant", "Feet in straps leg circles", "Arm work in straps"], correct: 1 },
    { q: "The Mermaid on Reformer is designed primarily to:", opts: ["Strengthen the quadriceps", "Open the lateral body through spring-assisted side stretching", "Build shoulder pressing strength", "Train hip external rotation"], correct: 1 }
  ];
}

function generateModule5Quiz() {
  return [
    { q: "Which type of cue is the most powerful and precise?", opts: ["Verbal", "Visual", "Tactile", "Imagery"], correct: 2 },
    { q: "External focus of attention directs attention to:", opts: ["Body mechanics", "The effect of movement or environment", "Specific muscle groups", "Breathing only"], correct: 1 },
    { q: "Research by Wulf and Prinz showed that which focus improves learning?", opts: ["Internal focus", "External focus", "No focus", "Anatomical focus"], correct: 1 },
    { q: "The first layer in the Cueing Hierarchy is:", opts: ["Core connection", "Movement initiation", "Overall shape/direction", "Refinement"], correct: 2 },
    { q: "Which is a common cueing mistake?", opts: ["Using silence strategically", "Giving all cues before the movement", "Demonstrating the exercise", "Observing the client"], correct: 1 },
    { q: "An effective cue for the Roll-Up is:", opts: ["Sit up fast", "Peel yourself off the mat one vertebra at a time", "Keep your back flat", "Don't move your arms"], correct: 1 },
    { q: "Negative cues should be reframed because:", opts: ["They are too short", "They describe what NOT to do, which the brain processes poorly", "They are too specific", "They are too loud"], correct: 1 },
    { q: "For an anxious client, the instructor should:", opts: ["Speak quickly and energetically", "Use a calm, reassuring voice", "Give more anatomical cues", "Demonstrate more"], correct: 1 },
    { q: "Kinaesthetic learners respond best to:", opts: ["Verbal explanation", "Written instructions", "Tactile cues and movement experience", "Anatomical diagrams"], correct: 2 },
    { q: "Silence during cueing is:", opts: ["A sign of incompetence", "Active learning time for the client", "Always inappropriate", "Only for advanced clients"], correct: 1 },
    { q: "'Float your arms like wings' is an example of which cue type?", opts: ["Anatomical", "Directional", "Imagery", "Tactile"], correct: 2 },
    { q: "Before using tactile cues, you must:", opts: ["Complete advanced training", "Obtain client consent", "Have a medical degree", "Have 5+ years experience"], correct: 1 },
    { q: "The Constrained Action Hypothesis relates to:", opts: ["Spring tension", "Internal vs external focus of attention", "Breathing patterns", "Exercise sequencing"], correct: 1 },
    { q: "Voice tempo should:", opts: ["Always be fast and energetic", "Match the movement speed", "Always be slow and quiet", "Remain constant regardless of exercise"], correct: 1 },
    { q: "Layer 5 of the Cueing Hierarchy involves:", opts: ["Setting the shape", "Core connection", "Movement initiation", "Global integration"], correct: 3 }
  ];
}

function generateModule6Quiz() {
  return [
    { q: "Relaxin hormone peaks during which trimester?", opts: ["First", "Second", "Third", "Postpartum"], correct: 0 },
    { q: "Supine position should be avoided after approximately:", opts: ["8 weeks", "12 weeks", "16–20 weeks", "30 weeks"], correct: 2 },
    { q: "Diastasis recti affects what percentage of women at 35 weeks?", opts: ["10–20%", "30–40%", "50–60%", "66–100%"], correct: 3 },
    { q: "'Coning' or 'doming' during exercise indicates:", opts: ["Excellent core strength", "Linea alba is the weakest link bearing load", "Proper engagement", "Need for more resistance"], correct: 1 },
    { q: "The 4R Approach for postnatal recovery stands for:", opts: ["Rest, Recover, Rehabilitate, Return", "Relax, Release, Realign, Restore", "Reduce, Rebuild, Retrain, Resume", "Repair, Reactivate, Rebalance, Reach"], correct: 1 },
    { q: "After a C-section, formal Pilates typically begins at:", opts: ["2 weeks", "4 weeks", "6 weeks", "8–12 weeks"], correct: 3 },
    { q: "For osteoporosis, loaded spinal flexion risks:", opts: ["Muscle strain", "Vertebral compression fracture", "Hip dislocation", "Shoulder impingement"], correct: 1 },
    { q: "Which is SAFE for osteoporosis clients?", opts: ["Rolling Like a Ball", "Crunches", "Standing footwork and balance exercises", "Full Roll-Up"], correct: 2 },
    { q: "A T-score of ≤ -2.5 on DEXA scan indicates:", opts: ["Normal bone density", "Osteopenia", "Osteoporosis", "Osteoarthritis"], correct: 2 },
    { q: "For disc herniations, which direction typically reduces symptoms?", opts: ["Flexion", "Extension", "Rotation", "Lateral flexion"], correct: 1 },
    { q: "A client with hip replacement (posterior approach) should avoid:", opts: ["Standing exercises", "Hip flexion past 90°", "Arm exercises", "Breathing exercises"], correct: 1 },
    { q: "For hypermobile clients, the priority is:", opts: ["Increasing flexibility", "Building stability before mobility", "Reaching end range", "Working at maximum ROM"], correct: 1 },
    { q: "When should a Pilates instructor refer a client to a physician?", opts: ["When they want to lose weight", "When red flags are present", "After every session", "Only if asked"], correct: 1 },
    { q: "Which is a red flag requiring immediate medical referral?", opts: ["Mild muscle soreness", "Tight hamstrings", "Bowel/bladder incontinence with back pain", "Difficulty touching toes"], correct: 2 },
    { q: "Pilates instructors should NOT:", opts: ["Modify exercises for known conditions", "Observe movement dysfunction", "Diagnose medical conditions", "Refer clients to healthcare providers"], correct: 2 },
    { q: "For scoliosis, the treatment approach should be:", opts: ["Symmetrical bilateral work", "Asymmetric — lengthen concave side, stabilize convex", "Avoid all exercise", "Focus only on extension"], correct: 1 },
    { q: "Pelvic floor can be too tight (hypertonic), causing:", opts: ["Only strength gains", "Pelvic pain and incontinence", "Better athletic performance", "No clinical significance"], correct: 1 },
    { q: "Third trimester focus should include:", opts: ["Advancing to advanced exercises", "Reverse Kegels and pelvic floor relaxation", "Heavy spring reformer work", "Prone exercises"], correct: 1 },
    { q: "Wolff's Law states that bone adapts to:", opts: ["Temperature changes", "The forces placed upon it", "Hormonal levels only", "Diet alone"], correct: 1 },
    { q: "The prenatal 'talk test' is used to monitor:", opts: ["Breathing technique", "Exercise intensity", "Pelvic floor engagement", "Fetal movement"], correct: 1 }
  ];
}

function generateModule7Quiz() {
  return [
    { q: "NPCP certification requires a minimum of how many training hours?", opts: ["200", "300", "450", "600"], correct: 2 },
    { q: "The NPCP exam consists of how many questions?", opts: ["75", "100", "125", "150"], correct: 2 },
    { q: "The NPCP exam time limit is:", opts: ["1 hour", "1.5 hours", "2 hours", "3 hours"], correct: 2 },
    { q: "Minimum passing score for the NPCP exam is:", opts: ["70%", "75%", "80%", "85%"], correct: 2 },
    { q: "NPCP certification must be renewed every:", opts: ["1 year", "2 years", "3 years", "5 years"], correct: 1 },
    { q: "How many CECs are required per renewal cycle?", opts: ["8", "12", "16", "24"], correct: 2 },
    { q: "Which is OUTSIDE a Pilates instructor's scope of practice?", opts: ["Modifying exercises for injuries", "Diagnosing medical conditions", "Observing movement patterns", "Referring to healthcare providers"], correct: 1 },
    { q: "Professional liability insurance typically covers:", opts: ["$100K per occurrence", "$500K per occurrence", "$1M per occurrence", "$5M per occurrence"], correct: 2 },
    { q: "Client health information should be:", opts: ["Shared with other clients for motivation", "Posted on social media", "Kept confidential", "Discussed openly in group classes"], correct: 2 },
    { q: "Informed consent must be:", opts: ["Obtained once at intake only", "Ongoing throughout the client relationship", "Only required for group classes", "Only for hands-on work"], correct: 1 },
    { q: "The exam content area with the highest weight is:", opts: ["Safety & Equipment", "Professional Responsibilities", "Teaching & Cueing", "Exercise Programming & Modifications"], correct: 3 },
    { q: "Every new client should complete:", opts: ["A fitness test", "A health history questionnaire and informed consent", "A full medical examination", "A blood pressure reading"], correct: 1 },
    { q: "Making medical claims about Pilates on social media is:", opts: ["Good marketing", "Required for business growth", "Unethical and potentially illegal", "Only acceptable with disclaimers"], correct: 2 },
    { q: "Which career path typically offers the highest earning potential?", opts: ["Studio employment", "Group fitness instructor", "Private practice", "Gym-based teaching"], correct: 2 },
    { q: "NPCP training must include which apparatus?", opts: ["Mat only", "Mat and Reformer only", "Mat, Reformer, and at least two other apparatus", "All five classical apparatus"], correct: 2 }
  ];
}

// ===== FINAL EXAM GENERATOR =====
function generateFinalExam() {
  // Pool questions from all modules proportionally
  const allQuestions = [];
  COURSE_MODULES.forEach((mod, i) => {
    mod.quiz.forEach((q, qi) => {
      allQuestions.push({ ...q, moduleId: mod.id, moduleTitle: mod.title, originalIndex: qi });
    });
  });
  // Shuffle and pick 125 (or all if less)
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(125, shuffled.length));
}
