const fs = require('fs');
const path = require('path');

const data = require('../data/gita_snippets.json');

// All 239 thoughtful, specific reflections based on each day's teaching
const thoughtfulReflections = [
  // Day 1-16: Chapter 1 - Arjuna Vishada Yoga
  'Notice today where you use the word "my" to create separation. My team, my people, my side. The Gita begins here—with the division that seeds all conflict. What would shift if you saw "them" as equally yours?',

  'Duryodhana lists warriors to reassure himself, yet his anxiety grows. When you find yourself over-explaining or over-preparing, pause. True confidence needs no justification. What are you trying to convince yourself of today?',

  'Duryodhana flatters Drona while subtly accusing him of divided loyalties. Watch for this pattern in yourself—compliments that carry hidden demands. When you praise others, is it pure, or does it come with expectations?',

  'The word "aparyaptam" means both "unlimited" and "insufficient." Duryodhana\'s mind oscillates between arrogance and fear. Notice when your confidence flips to anxiety—this reveals where your foundation is unstable.',

  'Bhishma\'s conch creates tumult; Krishna\'s creates something divine. The same action—blowing a conch—produces different qualities based on the consciousness behind it. What quality does your work carry today?',

  'Each Pandava\'s conch reflects their inner nature—Yudhishthira\'s "eternal victory," Bhima\'s "terrifying." Your actions are your conch. What does the sound of your life say about who you are?',

  'The Kaurava army, despite being larger, had their hearts "rent" by the Pandavas\' sound. When your cause is questionable, even small opposition feels threatening. If you\'re easily shaken today, examine your foundation.',

  'Arjuna asks to be placed between the armies to observe. Before acting, create space to truly see. What situation needs your clear observation before response?',

  'Arjuna suddenly sees teachers, uncles, sons, and friends on both sides. Every conflict involves people we\'re connected to. Before you oppose someone today, remember the web of relationships that connects all beings.',

  'Arjuna\'s limbs fail, his mouth dries, he trembles. The body speaks what the mind suppresses. What physical sensations are you ignoring? They may be pointing to an inner conflict that needs attention.',

  'Arjuna sees "adverse omens" everywhere. A disturbed mind finds confirmation of its fears in everything. If you\'re seeing only problems today, the issue may be your lens, not your circumstances.',

  'Arjuna lists every relationship on the battlefield—teachers, fathers, sons, in-laws. He\'s drowning in roles. Today, notice which role is creating your heaviest burden. Can you hold it more lightly?',

  'Arjuna uses noble arguments—protecting family, preserving dharma—to justify his desire to flee. Watch how the mind weaponizes wisdom. What "good reason" are you using to avoid what must be done?',

  'Arjuna fears the destruction of family traditions across generations. Fear often projects into the future. Return to now: what is actually being asked of you today, in this moment?',

  'Arjuna declares it would be better to be killed unarmed than to fight. This is grief disguised as philosophy. When your conclusions lead to complete withdrawal, question whether wisdom or pain is speaking.',

  'Arjuna throws down his bow and collapses. Sometimes we must reach the floor before we can rise differently. If you\'ve hit bottom in some area, know that this is where transformation begins.',

  // Day 17-40: Chapter 2 - Sankhya Yoga
  'Krishna\'s first words are not comfort but challenge: "Where has this weakness come from?" Sometimes love confronts. Who in your life trusts you enough to challenge your excuses?',

  'Arjuna admits his confusion and asks for teaching. This vulnerable "I don\'t know" opens every door. What question have you been afraid to ask because it means admitting uncertainty?',

  'Arjuna asks Krishna to be his teacher, not his friend. Sometimes we need guidance more than agreement. Is there an area where you need a teacher\'s clarity rather than a friend\'s comfort?',

  'Krishna says the wise grieve neither for the living nor the dead. This isn\'t coldness—it\'s seeing beyond the temporary. What grief might soften if you touched the eternal in those you\'ve lost?',

  'The Self was never born and will never die. Beneath your changing body, moods, and circumstances—what has remained constant throughout your entire life? That\'s a clue to what you truly are.',

  'As a person casts off worn garments and puts on new ones, the Self casts off worn bodies. Your body is a vehicle, not your identity. How would you treat it—and others\'—differently knowing this?',

  'Weapons cannot cut the Self, fire cannot burn it, water cannot wet it, wind cannot dry it. What fear would dissolve if you truly knew your essence is untouchable?',

  'The Self is unmanifest, inconceivable, unchangeable. You cannot think your way to it—only recognize it. Today, spend one minute simply being aware of awareness itself.',

  'For the born, death is certain; for the dead, rebirth is certain. Fighting the inevitable exhausts us. What are you resisting that simply is the nature of things?',

  'Your own dharma, though imperfect, is better than another\'s dharma perfectly performed. Stop comparing your path to others\'. What is YOUR unique work in this world?',

  'Even maintaining the body requires action; total inaction is impossible. Since you must act, act consciously. What unconscious action today could become a conscious offering?',

  'Perform action without attachment to fruits. This doesn\'t mean don\'t care—it means care fully, then release. What outcome are you gripping so tightly that it\'s strangling your peace?',

  'Yoga is skill in action. Mastery comes not from what you do but how you do it. Choose one ordinary task today and perform it with complete presence and care.',

  'The wise see a learned brahmin, a cow, an elephant, a dog, and an outcaste as the same. Practice seeing past labels today. The same consciousness animates all beings.',

  'Like a tortoise withdrawing its limbs, the wise withdraw their senses from sense objects. You don\'t need to leave the world—just choose when to engage. What sense pleasure is pulling you off center?',

  'Even for the wise, the turbulent senses can carry away the mind. Vigilance isn\'t paranoia—it\'s honoring how powerful distraction is. What draws you away from what matters most?',

  'Thinking of sense objects creates attachment; attachment creates desire; frustrated desire becomes anger. Trace your anger back today—what desire is underneath it?',

  'From anger comes delusion; from delusion, confused memory; from confused memory, destruction of discrimination. The chain is predictable. Where can you interrupt it in yourself?',

  'One who moves through the world free from attraction and aversion attains tranquility. Today, notice one attraction and one aversion. Can you soften your grip on both?',

  'That which is night for all beings is waking time for the self-controlled. The sage is awake to what others ignore, asleep to what others obsess over. What truth is everyone around you asleep to?',

  'As waters flow into an ocean that is ever full yet unmoved, so desires flow into the sage without disturbance. Can you let today\'s events flow into you without losing your stillness?',

  'This is the brahmic state—attaining this, one is not deluded. Established even at death, one attains liberation. Don\'t wait for the end. Practice this unshakeable peace now.',

  // Days 41-56: Chapter 3 - Karma Yoga
  'If knowledge is superior, why urge me to action? Arjuna asks. We all want an escape from doing. But wisdom without action is incomplete. What insight are you failing to act on?',

  'No one can remain without action even for a moment—nature compels us. Since action is inevitable, choose meaningful action. What would you do today if you stopped pretending inaction was possible?',

  'The one who controls the organs of action but dwells mentally on sense objects deludes themselves. Outer renunciation with inner craving is hypocrisy. Is your mind where your body is?',

  'Perform your duty; action is superior to inaction. Even bodily maintenance is impossible without action. What necessary action are you postponing under the guise of waiting for clarity?',

  'The world is bound by action unless performed as sacrifice. Act for that purpose, free from attachment. What if your work today was an offering rather than an obligation?',

  'By sacrifice, the gods flourish; by gods, you flourish. This cycle of mutual nourishment is the wheel of life. What are you contributing to the whole, and what is the whole contributing to you?',

  'One who enjoys gifts without offering back is a thief. Receiving without giving creates debt. What have you received that you haven\'t yet honored by passing it forward?',

  'The virtuous who eat the remnants of sacrifice are freed from sin. Those who cook only for themselves eat sin. How much of your effort feeds only you versus serves the larger whole?',

  'Beings arise from food, food from rain, rain from sacrifice, sacrifice from action. You are woven into a vast cycle. Today, honor one link in this chain that sustains you.',

  'One who does not follow the wheel set in motion lives in vain. To opt out of life\'s reciprocity is to waste human birth. Where are you trying to take without contributing?',

  'But for one who delights in the Self alone, there is no duty. Such a being depends on nothing. Until you reach this freedom, fulfill your responsibilities with presence.',

  'Janaka and others attained perfection through action. For the welfare of the world, you should act. You\'re not just working for yourself—your actions shape the collective. What example are you setting?',

  'Whatever a great one does, others follow. The standard they set, the world pursues. You are watched more than you know. What would change if you truly accepted your influence?',

  'If I did not act, these worlds would perish, Krishna says. Some responsibilities only you can fulfill. What would collapse if you stopped showing up?',

  'The wise should not unsettle the minds of the ignorant attached to action, but engage them skillfully. Meet people where they are, not where you think they should be.',

  'All actions are performed by the gunas of nature. The self-deluded, confused by ego, think "I am the doer." Watch today who you think is doing your actions—you, or the forces moving through you?',

  // Days 57-70: Chapter 4 - Jnana Yoga
  'I taught this yoga to the sun god long ago, Krishna reveals. This wisdom is ancient, yet must be realized fresh in each person. What timeless truth are you rediscovering for yourself?',

  'Many births have passed for you and me, Arjuna. I know them all; you do not. What patterns keep repeating in your life? They may be older than you think.',

  'Whenever dharma declines, I manifest myself. In times of darkness, light appears. Where in your life is something new trying to be born from what\'s fallen apart?',

  'As people approach me, so I receive them. All paths ultimately lead to me. How are you approaching the sacred today—and how is it meeting you in return?',

  'Actions do not taint me; I have no desire for fruits. One who knows this is not bound. Can you act fully without demanding that results match your wishes?',

  'Even the wise are confused about action and inaction. I shall teach you that by which you will be freed. Sometimes the deepest action looks like stillness. Sometimes activity is just busy-ness. Know the difference.',

  'One who sees inaction in action and action in inaction is wise. The body may move while the mind is still. The body may be still while the mind races. Which is true action?',

  'Having abandoned attachment to fruits, ever content, dependent on nothing—though engaged, one does nothing at all. Full engagement, zero clinging. This is the art.',

  'The fire of knowledge reduces all karma to ashes. What ignorance is fueling your current struggles? Seek the knowledge that dissolves it.',

  'There is nothing so purifying as knowledge. The one perfected in yoga finds it in the Self in time. Trust the process—wisdom is ripening in you even now.',

  'The one who lacks faith and doubts is destroyed. Neither this world nor the next is for the doubter. Doubt your doubts. At some point, you must choose to trust your path.',

  'Therefore, with the sword of knowledge, cut this doubt in your heart. Arise! Stand in yoga! What doubt has lived too long in you? Today, cut it.',

  // Days 71-86: Chapter 5 & 6 - Sannyasa & Dhyana Yoga
  'You praise both renunciation and yoga—tell me decisively which is better. We want clear answers. But both paths lead home. Which one fits YOUR nature?',

  'Renunciation without yoga is difficult. The sage engaged in yoga reaches Brahman quickly. Don\'t skip the work and jump to withdrawal. Earn your stillness through right action.',

  'One who is disciplined, pure in heart, self-controlled, who sees the Self in all beings—even while acting, is not tainted. Purity comes not from avoiding life, but from how you engage it.',

  'The yogi, while seeing, hearing, touching, smelling, eating, walking, sleeping, breathing, holds "I do nothing at all." Let go of doer-ship today. You are the witness, not the actor.',

  'One who acts placing all in Brahman, abandoning attachment, is not touched by sin—like a lotus leaf by water. Be IN the mess without being OF the mess.',

  'Yogis perform action by body, mind, senses, and intellect, without attachment, for self-purification. Every action can polish you or tarnish you. What\'s your intention behind today\'s tasks?',

  'The steady one, giving up fruits, attains peace. The unsteady, attached to fruits, is bound. What result are you demanding today that is disturbing your peace?',

  'The embodied one who mentally renounces all actions rests happily in the city of nine gates. You can be free right where you are—even this body can be a place of peace.',

  'Neither doer-ship nor deeds does the Lord create, nor connection of action with fruit. It is nature that acts. You\'re not in control the way you think. What relief might this bring?',

  'Knowledge is covered by ignorance; by it creatures are deluded. But for whom ignorance is destroyed, knowledge illumines like the sun. What obvious truth are you not seeing?',

  'One who performs duty without depending on fruits is the true sannyasi, not one who merely avoids fire and ritual. Renunciation isn\'t quitting—it\'s non-attachment while fully engaged.',

  'For one wishing to ascend yoga, action is the means. For one ascended, stillness is the means. Where are you in the journey? Do you need more action or more stillness?',

  'One should lift oneself by oneself; one should not degrade oneself. The self alone is the friend of the self; the self alone is the enemy of the self. No one is coming to save you. And no one can destroy you but you.',

  'The self is the friend of one who has conquered oneself; for one unconquered, the self is hostile like an enemy. Your greatest ally and your greatest saboteur live in the same skin. Which will you feed today?',

  'To the one who has conquered the self, the Supreme Self is already reached—in cold and heat, pleasure and pain, honor and dishonor, that one is at peace. Mastery means weather doesn\'t change your climate.',

  'Content with knowledge and wisdom, established, sense-conquered, seeing earth, stone, and gold as the same—that one is a yogi. What externals still have too much power over your inner state?',

  // Days 87-102: Chapter 6 continued & 7 - Dhyana & Jnana Vijnana Yoga
  'One who regards friends, companions, enemies, neutral, arbiters, hateful, relatives, saints, and sinners equally is distinguished. This isn\'t passivity—it\'s freedom from the tyranny of categories.',

  'The yogi should constantly practice in solitude, alone, with controlled mind, free from desires and possessions. Solitude isn\'t isolation—it\'s the capacity to be complete without external props.',

  'Having made the mind one-pointed, controlling thought and senses, seated in yoga, one should practice for self-purification. The scattered mind sees nothing clearly. Gather yourself.',

  'Yoga is not for one who eats too much or too little, or who sleeps too much or too little. Balance in basics supports depth in practice. How are you with the fundamentals?',

  'When the disciplined mind rests in the Self alone, free from longing for desires—then one is said to be in yoga. Yoga isn\'t a pose. It\'s the mind at rest in its source.',

  'As a lamp in a windless place does not flicker—such is the yogi of controlled mind practicing yoga of the Self. What would it take for your mind to become this steady?',

  'That state in which the mind, restrained by practice, is quiet, in which one sees the Self by the self and is satisfied in the Self alone... this is yoga.',

  'Little by little, with patience and persistence, the mind should be stilled by the intellect. Established in the Self, think of nothing else. Meditation isn\'t instant. It\'s patient repetition.',

  'Wherever the wandering, unsteady mind goes, from there it should be brought back to rest in the Self alone. Not if the mind wanders, but when. Just keep returning.',

  'The yogi sees the Self in all beings and all beings in the Self. One who sees me everywhere and sees all in me—to that one I am not lost, nor is that one lost to me.',

  'With mind attached to me, practicing yoga, taking refuge in me, you shall know me completely, without doubt. Intellectual knowledge alone isn\'t enough. Have you taken refuge?',

  'Among thousands, one strives for perfection; among those who strive, rare is one who knows me in truth. The path is long and few complete it. But you\'ve started. That itself is rare.',

  'Earth, water, fire, air, space, mind, intellect, and ego—these are my eightfold divided nature. Everything you experience is God divided into forms. See the One in the many today.',

  'Beyond this lower nature is my higher nature—the life-principle by which the universe is sustained. You are not just the elements. You are what animates them.',

  'All beings have their source in these two natures. I am the origin and dissolution of the entire universe. Everything comes from one source and returns there. You are not separate from this cycle.',

  'There is nothing higher than me. All this is strung on me like pearls on a string. Can you see your life—every person, every event—as threaded on one divine string?',

  // Days 103-118: Chapter 7 continued & 8 - Akshara Brahma Yoga
  'I am the taste in water, the light in the moon and sun, the syllable Om, the sound in space, the ability in humans. The divine isn\'t far. It\'s the essence of every experience you have today.',

  'I am the pure fragrance in earth, the brilliance in fire, the life in all beings, the austerity in ascetics. The sacred pervades the ordinary. Nothing is merely secular.',

  'Three gunas born of prakriti delude this world. They don\'t know me—beyond the gunas, unchanging. You\'re caught in nature\'s play. The witness behind the play is who you truly are.',

  'This divine maya of mine, consisting of the gunas, is hard to cross. Those who take refuge in me alone cross over. Trying to figure it out won\'t free you. Only surrender does.',

  'Four kinds of virtuous ones worship me: the distressed, the seeker of knowledge, the seeker of wealth, and the wise. Whatever brings you to the divine is valid. What brought you?',

  'At the end of many births, the wise one takes refuge in me, knowing Vasudeva is all. Such a great soul is rare. After lifetimes of seeking, the search ends in surrender.',

  'Those whose knowledge is stolen by desires take refuge in other gods, following various rites, constrained by their own nature. Desire shapes worship. What are you really worshipping?',

  'What is Brahman? What is the Self? What is karma? What is adhibhuta? Adhidaiva? Arjuna asks. Before seeking answers, know your questions. What are YOU really asking about existence?',

  'Brahman is the imperishable supreme. One\'s own nature is the self. The creative force causing the origin of beings is called karma. Everything has layers—divine, individual, cosmic, active. Reality is richer than it appears.',

  'Whoever at the time of death, leaving the body, departs remembering me alone attains my being. What fills your mind daily will fill it at death. What are you rehearsing?',

  'Therefore, at all times, remember me and fight. Mind and intellect fixed on me, you will come to me alone. Spirituality isn\'t separate from life. Fight your battles with God in mind.',

  'With mind unwandering, disciplined by practice, meditating on the supreme divine Being, one goes to that Being. Where you direct attention, you go. Where is your attention going by default?',

  'The one who meditates on the Ancient, the Ruler, subtler than subtle, the support of all, beyond darkness—that one attains the supreme. What is your image of the highest? Let it pull you upward.',

  'All worlds up to Brahma\'s realm are subject to return. But having attained me, there is no rebirth. Every achievement in the world is temporary. Only the divine is permanent. What are you building that lasts?',

  'A day of Brahma is a thousand yugas; so is the night. Those who know this understand day and night. The scale of existence is beyond imagination. Your problems exist in a vast, vast context.',

  'From the unmanifest, all manifest beings emerge at daybreak; at nightfall, they dissolve. Again and again. The universe breathes. What is emerging in your life now? What is dissolving?',

  // Days 119-136: Chapter 9 & 10 - Raja Vidya & Vibhuti Yoga
  'I shall declare to you this most secret knowledge, combined with realization, knowing which you shall be freed from inauspiciousness. The supreme secret is being shared. Are you ready to receive it?',

  'This is sovereign knowledge, the sovereign secret, supremely holy, directly experienced, righteous, easy to practice, imperishable. The greatest truths are often the simplest. What obvious truth do you keep missing?',

  'By me, in my unmanifest form, all this universe is pervaded. All beings exist in me; I don\'t exist in them. The container doesn\'t depend on the contained. What depends on you? What are you depending on?',

  'Yet beings don\'t exist in me—behold my divine yoga! Supporting beings but not existing in them, my Self is the cause of beings. This is the mystery: God is everything, yet transcends everything.',

  'As the great wind moving everywhere rests always in space, so all beings rest in me. You\'re held by something vast, even when you feel alone. You cannot fall out of existence.',

  'Under my direction, prakriti produces the moving and unmoving; by this cause, the world revolves. All of nature\'s activity is supervised. There\'s intelligence behind the chaos.',

  'Fools disregard me dwelling in human form, not knowing my higher nature as Lord of beings. The divine appears in ordinary packages. Who are you dismissing that might be a teacher?',

  'The great souls take refuge in the divine nature, knowing me as the imperishable source of beings. They worship with minds fixed on me. Single-mindedness isn\'t obsession—it\'s devotion.',

  'Always glorifying me, striving with firm vows, bowing to me, they worship me with devotion, ever united. What would it mean to be ALWAYS connected? Not occasionally religious, but continuously devoted.',

  'Others worship me through the sacrifice of knowledge—as one, as distinct, as facing everywhere. Some see one God, some see many, some see God in all directions. All these are valid approaches.',

  'I am the ritual, the sacrifice, the offering, the medicinal herb, the mantra, the butter, the fire, and the oblation. Everything in worship points to one source. What ritual in your life reconnects you?',

  'I am the father, mother, sustainer, and grandsire of this universe—the syllable Om, and the Rig, Sama, and Yajur Vedas. All relationships are reflections of one divine relationship.',

  'Neither gods nor great sages know my origin; I am the source of all of them. Knowing me as unborn and beginningless, the great Lord—such a mortal is undeluded. Everything you seek the origin of comes from something beyond origins.',

  'Intelligence, knowledge, non-delusion, patience, truth, self-control, tranquility, pleasure, pain, birth, death, fear, and fearlessness—all these different conditions of beings arise from me alone. Every quality you admire and fear has one source.',

  'The seven great sages and four Manus, from whom all creatures descend, were born of my mind. All lineages trace back to one mind. Your ancestry is ultimately divine.',

  'One who knows in truth my divine manifestations and yoga—that one is established in unwavering yoga. Seeing God\'s presence everywhere stabilizes you. What would you need to recognize divinity in?',

  'I am the source of all; from me everything proceeds. Understanding this, the wise worship me with loving consciousness. Worship isn\'t ritual—it\'s recognizing the source with love.',

  'With minds fixed on me, lives dedicated to me, enlightening one another, always speaking of me, they are content and rejoice. Community around the divine multiplies joy. Who do you speak of God with?',

  // Days 137-154: Chapter 10 continued & 11 - Vishwarupa Darshana Yoga
  'To those ever devoted, worshipping with love, I give the yoga of understanding by which they come to me. Devotion brings understanding—not the reverse. Love first, knowledge follows.',

  'Out of compassion for them, dwelling in their hearts, I destroy the darkness born of ignorance with the shining lamp of knowledge. God lives in your heart and removes darkness from within. You\'re never alone in your struggle.',

  'You are the supreme Brahman, supreme abode, supreme purifier, the eternal divine being, primal God, unborn, all-pervading—Arjuna declares. After receiving knowledge, Arjuna recognizes Krishna. Who in your life might be more than they appear?',

  'Tell me your divine manifestations by which you pervade these worlds—Arjuna asks. Wanting to know where God is present is a worthy question. Ask it yourself today.',

  'I am the Self seated in the hearts of all beings. I am the beginning, middle, and end of all beings. God isn\'t just the source and goal—God is the entire journey. You\'re walking IN divinity.',

  'Of the Adityas, I am Vishnu; of lights, the radiant sun; of Maruts, Marichi; of stars, the moon. In every category, the divine shines brightest in something. What in your field is the most luminous?',

  'Of Vedas, Sama; of gods, Indra; of senses, the mind; of beings, consciousness. What is the highest in you? That\'s where the divine is most visible. Honor it.',

  'Know that whatever is glorious, prosperous, powerful—all that arises from a fraction of my splendor. Every excellence you see is a tiny fragment of divine glory. Let that humble and inspire you.',

  'If you think I am worthy, Lord, show me your imperishable Self—Arjuna asks. Are you ready to ask for the full vision? It will transform how you see everything.',

  'Behold my hundreds and thousands of forms—divine, various colored, various shaped. Be ready to be overwhelmed. The real is not neat.',

  'See today the entire universe, moving and unmoving, united in my body—and whatever else you wish to see. Everything is already one. You just need eyes to see it.',

  'But you cannot see me with your ordinary eyes. I give you divine sight—behold my supreme yoga! Normal perception cannot grasp the whole. You need transformed vision.',

  'Sanjaya describes to Dhritarashtra: countless mouths, eyes, wonders, divine ornaments, celestial garlands and garments, anointed with divine fragrances—infinite, facing everywhere. Reality is richer than your richest imagination.',

  'If a thousand suns were to rise at once in the sky, that might resemble the splendor of that great Being. Imagine what you cannot imagine. Then know reality exceeds even that.',

  'There Arjuna saw the entire universe, divided yet united, in the body of the God of gods. All divisions are contained within one body. Separation is an illusion.',

  'Arjuna, filled with amazement, hair standing on end, bowing his head, speaks with palms joined. The proper response to the divine vision is awe, humility, and devotion. Have you been properly amazed lately?',

  'I see all the gods, the hosts of various beings, Brahma on the lotus seat, all sages and celestial serpents. Every level of existence is visible in the cosmic form. You too are part of this vast tapestry.',

  'I see you, infinite in form, with many arms, bellies, mouths, eyes—I see no end, no middle, no beginning. God has no boundary. What boundaries do you cling to that limit your vision?',

  // Days 155-176: Chapter 11 continued & 12 - Bhakti Yoga
  'I see you with crown, mace, and discus, a mass of radiance shining everywhere, hard to look at, blazing like immeasurable fire and sun. The divine is not comfortable. It\'s overwhelming.',

  'You are the imperishable, the supreme to be known, the resting place of this universe, the undying guardian of eternal dharma. When everything falls apart, what remains? That\'s what you\'re looking for.',

  'I see you without beginning, middle, or end, infinite in power, with countless arms, sun and moon as eyes, blazing fire as mouth, heating this universe with your radiance. You\'re part of something burning with aliveness.',

  'This space between heaven and earth, all the directions, is filled by you alone. Seeing this wondrous, terrible form, the three worlds tremble. The divine fills every gap. There\'s nowhere God isn\'t.',

  'These hosts of gods enter you; some, terrified, praise you with folded hands. Sages and perfected ones cry "Svasti!" The cosmic vision terrifies and inspires simultaneously. Truth does both.',

  'Seeing your great form with many mouths and eyes, many arms, thighs, feet, many bellies, many terrible tusks—the worlds tremble, and so do I. The real unsettles before it liberates.',

  'Seeing you touching the sky, blazing, many-colored, mouths wide open, large flaming eyes—my inner self trembles; I find no steadiness or peace. Spiritual experience isn\'t always peaceful. Sometimes it shatters.',

  'Seeing your mouths with terrible tusks, blazing like time\'s destruction, I know not the directions; I find no shelter. Have mercy, Lord of gods, refuge of the world! When you see too much, you can only ask for mercy.',

  'All these sons of Dhritarashtra with hosts of kings, Bhishma, Drona, Karna, along with our chief warriors, are rushing into your terrible mouths. The vision shows time consuming all. Even the mighty are food for time.',

  'As many torrents of rivers flow toward the ocean, so these heroes of the human world enter your flaming mouths. All paths lead to the same destination. Life flows toward dissolution.',

  'As moths rush swiftly into a blazing fire to perish, so these creatures rush into your mouths with great speed to their destruction. We hurtle toward our ends. What makes this truth bearable?',

  'You lick up all the worlds with your flaming mouths, swallowing them. Your fierce rays fill the whole universe with radiance and scorch it. Time consumes everything. This is neither good nor bad—it just is.',

  'Tell me who you are, so fierce in form. Salutations to you, supreme God! Be gracious. I wish to know you, the primal one; I do not understand your working. Even Arjuna cannot comprehend. Some truths exceed understanding.',

  'I am mighty world-destroying Time, engaged here in destroying the worlds. Even without you, all these warriors arrayed in opposing armies shall cease to exist. Time wins all battles. Your role is smaller than you think.',

  'Therefore arise, win glory, conquer enemies, enjoy a prosperous kingdom. They have already been slain by me; be merely the instrument. You\'re not the doer. You\'re the instrument. Act accordingly.',

  'Drona, Bhishma, Jayadratha, Karna, and other brave warriors have already been killed by me. Kill them without distress. Fight—you shall conquer your enemies. What you resist has already been resolved. Your work is just to show up.',

  'Having heard Krishna\'s words, Arjuna, trembling, with palms joined, prostrating, spoke again with choked voice, extremely afraid. Even after revelation, Arjuna trembles. Truth doesn\'t make you comfortable—it makes you real.',

  'It is right that the world delights and rejoices in your praise; demons flee in fear and hosts of perfected ones bow. Proper response to the divine includes both joy and awe.',

  'You are the primal God, the ancient Being, the supreme resting place of this universe, the knower and the known, the supreme abode. By you alone is the universe pervaded. There is nowhere you can go that God is not.',

  'Forgive me for whatever I may have said rashly, thinking you merely a friend, "O Krishna, O Yadava, O Friend," unaware of your greatness. Arjuna apologizes for treating the infinite casually. Where have you been too casual with the sacred?',

  'Having seen what was never seen before, I am delighted, yet my mind is shaken with fear. Show me that form again; be gracious, Lord of gods, refuge of the world! After cosmic vision, Arjuna wants the familiar form back. The infinite is hard to bear.',

  'Those who worship you with devotion, ever united, or those who worship the imperishable, unmanifest—which are better versed in yoga? Arjuna asks the ultimate question: personal or impersonal path?',

  // Days 177-192: Chapter 12 & 13 - Kshetra Kshetrajna Yoga
  'Those who fix their minds on me, ever united, endowed with supreme faith—they are best in yoga to me. The answer: personal devotion is the direct path. Love is faster than analysis.',

  'But those who worship the imperishable, indefinable, unmanifest, all-pervading, inconceivable, unchanging, immovable, constant—they also reach me. The impersonal path works too—it\'s just harder for embodied beings.',

  'Those whose minds are set on the unmanifest have greater difficulty, for the unmanifest goal is hard for embodied beings to reach. You have a body. Use devotion that fits embodiment.',

  'Those who surrender all actions to me, intent on me, worship me meditating on me with exclusive yoga—I swiftly deliver them from the ocean of death. Total surrender gets the fastest rescue.',

  'Fix your mind on me alone, let your intellect dwell in me—you shall live in me thereafter. If you can do this, there\'s nothing else to do. Can you?',

  'If you cannot fix your mind steadily on me, then seek to reach me by repeated practice. If spontaneous devotion isn\'t available, practice builds it. Keep returning.',

  'If you are unable even to practice, be intent on action for me. Even performing actions for my sake, you shall attain perfection. If you can\'t meditate, work as worship.',

  'If you cannot do even this, taking refuge in me, with self-control, give up the fruit of all action. If all else fails, just let go of results. That alone liberates.',

  'Better indeed is knowledge than practice; better than knowledge is meditation; better than meditation is giving up fruits of action—from renunciation, peace immediately follows. The hierarchy is clear: action, knowledge, meditation, renunciation.',

  'One who hates no being, who is friendly and compassionate, free from possessiveness and ego, equal in pain and pleasure, patient... these are the qualities of the beloved devotee.',

  'The body is called the field; one who knows it is the field-knower. Know me as the field-knower in all fields. You are not your body. You are what knows your body.',

  'What the field is, of what nature, its modifications, whence what, who the knower is and what powers—hear this from me. Understanding the instrument you operate is essential.',

  'The great elements, ego, intellect, unmanifest, the ten senses and one mind, five sense objects—this is the field, briefly described. Everything you experience is the field. You are not it.',

  'Absence of pride, unpretentiousness, non-injury, patience, uprightness, service to teacher, purity, steadfastness, self-control—these are declared as knowledge. These qualities make you fit to receive wisdom.',

  'Non-attachment, non-identification with son, wife, home, constant equanimity in desired and undesired—this is knowledge. Attachment isn\'t love. Non-attachment allows real love.',

  'Unwavering devotion to me through exclusive yoga, resorting to solitary places, distaste for crowds—this is knowledge. Knowing what environments support your growth is wisdom.',

  // Days 193-208: Chapter 13 continued, 14 & 15 - Gunatita & Purushottama Yoga
  'Constant reflection on Self-knowledge, seeing the purpose of truth-knowledge—this is knowledge. All else is ignorance. If your learning doesn\'t reveal the Self, it\'s distraction.',

  'I shall declare that which is to be known, knowing which one attains immortality—beginningless supreme Brahman, called neither being nor non-being. The ultimate is beyond your categories.',

  'With hands and feet everywhere, eyes, heads, mouths everywhere, with ears everywhere, That exists enveloping all. The divine has infinite access points. You can reach it from anywhere.',

  'Appearing to have sense qualities, yet devoid of senses, unattached yet supporting all, without qualities yet experiencing qualities. God contains all contradictions.',

  'Outside and inside beings, moving and unmoving, too subtle to be known, far yet near. The divine is not somewhere else. It\'s closer than close.',

  'Undivided yet existing as if divided in beings, known as the supporter of beings, the devourer and creator. One reality appears as many. You\'re looking at one thing pretending to be everything.',

  'I shall again declare the supreme knowledge, best of all knowledge, knowing which all sages have passed to supreme perfection. This wisdom liberates. Are you tired enough of bondage to receive it?',

  'Taking refuge in this knowledge, attaining identity with me, they are not born at creation nor disturbed at dissolution. Liberation is possible—not just belief, but actual freedom.',

  'My womb is the great Brahman; in that I place the seed; from that is the birth of all beings. Nature is the mother; consciousness is the seed. You are born from their union.',

  'Whatever forms originate in any wombs, of those Brahman is the great womb, I am the seed-giving father. All birth everywhere has one father. You share parentage with all beings.',

  'Sattva, rajas, tamas—these qualities born of prakriti bind the imperishable embodied one to the body. Three forces—light, movement, inertia—trap the soul. Know which is running you now.',

  'Sattva, being pure, illuminating, free from sickness, binds by attachment to happiness and knowledge. Even goodness binds when you\'re attached to it. The trap is subtle.',

  'Rajas, know to be of the nature of passion, source of thirst and attachment; it binds the embodied one by attachment to action. Desire drives ceaseless doing. Notice what you can\'t stop chasing.',

  'Tamas, born of ignorance, deluding all embodied ones, binds by heedlessness, indolence, and sleep. What are you avoiding through sleep, distraction, or numbness?',

  'When the embodied one transcends these three gunas from which the body arises, freed from birth, death, old age, and sorrow, one attains immortality. Beyond the three is freedom.',

  'With roots above and branches below, the Ashvattha tree is said to be imperishable; its leaves are the Vedas; one who knows this knows the Vedas. Life is an upside-down tree. Your roots are in the sky.',

  // Days 209-224: Chapter 15 continued, 16 & 17 - Daivasura & Shraddhatraya Vibhaga Yoga
  'Below and above spread its branches, nourished by the gunas; sense objects are its shoots; below, roots extend, causing bondage through action in the human world. The tree keeps growing through your actions.',

  'Its form is not perceived here—neither end, nor beginning, nor continuance. Having cut this firm-rooted tree with the strong axe of non-attachment, then seek that place from which none return. Cut attachments to find what\'s permanent.',

  'I take refuge in that Primal Being from whom the ancient stream of existence flowed—free from pride and delusion, victorious over attachment, ever dwelling in the Self. This is the goal: return to the source.',

  'Without pride, delusion, attachment conquered, ever devoted to the Self, desires turned away, freed from pairs of opposites—such undeluded ones reach the imperishable. The path is clear. Walk it.',

  'Neither sun nor moon nor fire illumines That, reaching which none return—that is my supreme abode. There\'s a light that lights all other lights. Seek that.',

  'A part of myself, eternal, becomes a living soul in the world, drawing to itself the six senses including mind resting in prakriti. You are a divine fragment learning through a body.',

  'Fearlessness, purity of heart, steadfastness in knowledge-yoga, charity, self-control, sacrifice, study, austerity, straightforwardness—these belong to the divine nature. Which of these do you embody? Which need cultivation?',

  'Non-injury, truth, absence of anger, renunciation, peace, absence of fault-finding, compassion for beings, non-covetousness, gentleness, modesty, steadiness—divine qualities. Let this be your checklist today.',

  'Boldness, forgiveness, fortitude, purity, non-hatred, absence of pride—these belong to one born for divine estate. Pride is the hinge. Check your pride today.',

  'Hypocrisy, arrogance, pride, anger, harshness, ignorance—these belong to one born for demonic estate. Notice which of these arise in you. Don\'t judge—just notice, then choose differently.',

  'Divine nature leads to liberation; demonic to bondage. Grieve not—you are born with divine nature. You have what it takes. Trust your deeper nature.',

  'Demonic people know not action nor renunciation, neither purity nor proper conduct nor truth. They say the world is unreal, without foundation, without God. Nihilism is a demonic stance. The world is real and sacred.',

  'Those who neglect scriptural injunctions but worship with faith—what is their state? Is it sattva, rajas, or tamas? Faith without knowledge needs examination.',

  'The faith of each corresponds to their nature. A person is made of faith; as one\'s faith is, so is one. You become what you trust. What do you really have faith in?',

  'Sattvic people worship gods; rajasic, yakshas and rakshasas; tamasic worship ghosts and spirits. What you worship reveals your inner state.',

  'Those who practice violent austerities not enjoined by scripture, possessed of hypocrisy and egoism, driven by desire and attachment—they are demonic in resolve. Spirituality that harms is not spiritual.',

  // Days 225-239: Chapter 17 continued & 18 - Moksha Sannyasa Yoga
  'Food that promotes life, vitality, strength, health, happiness, and satisfaction—savory, smooth, firm, pleasant—is dear to the sattvic. What you eat affects who you become.',

  'Foods that are bitter, sour, salty, very hot, pungent, dry, burning, producing pain, grief, and disease are desired by the rajasic. Notice how food affects your mind.',

  'Sacrifice offered according to scripture, by those who desire no fruit, with mind fixed on the thought "this ought to be offered"—that is sattvic. Act because it\'s right, not for reward.',

  'I wish to know the truth of sannyasa and tyaga separately—Arjuna asks. What\'s the difference between renouncing and letting go?',

  'Giving up desire-motivated actions is sannyasa; giving up fruits of all actions is tyaga—so say the wise. You can renounce actions or just renounce attachment to their results.',

  'Hear my definitive conclusion on tyaga: it is declared to be threefold. Sacrifice, gift, and austerity should not be abandoned—they purify the wise. Don\'t give up good actions—give up attachment to them.',

  'Even these actions should be performed giving up attachment and fruits—this is my highest definite view. The final teaching: do everything, cling to nothing.',

  'Five factors for accomplishment of all action: the body, the doer, various instruments, various functions, and divine providence. You\'re not the only actor. Many factors converge.',

  'This being so, one who sees the Self alone as doer, due to incomplete understanding, does not see. The ego claims doership falsely. You are not the doer you think you are.',

  'Knowledge, action, and doer are declared to be threefold according to the guna classification. Everything comes in three flavors.',

  'That knowledge by which one sees the one imperishable Being in all beings, undivided in the divided—know that to be sattvic. The highest knowledge sees unity in diversity.',

  'Regulated action done without attraction or aversion by one desiring no fruit—that is called sattvic. This is how to act: fully, freely, without gripping.',

  'Surrendering all actions to me, with mind on the Self, free from hope and selfishness, fight—with fever gone. The Gita\'s summary instruction: surrender, then act.',

  'Abandon all dharmas and take refuge in me alone. I shall liberate you from all sins; do not grieve. The final promise: complete surrender brings complete freedom.',

  'The Gita concludes: wherever there is Krishna, the Lord of yoga, and Arjuna, the archer—there are prosperity, victory, happiness, and firm righteousness. Divinity and effort together create all good things. Bring both to your life today.',

  'One who teaches this supreme secret to devotees, showing utmost devotion to me, shall without doubt come to me. Sharing wisdom is the highest service. What have you learned that is meant to be passed on?',

  'None among people does dearer service to me than such a one, nor shall there be another on earth more dear. Teaching the Gita to the ready is the greatest act of love. Who in your life is ready?',

  'One who studies this sacred dialogue of ours worships me by the sacrifice of knowledge—this is my view. Study itself is worship. Your daily reading is an offering to the divine.',

  'Sanjaya declares: Wherever there is Krishna, the Lord of yoga, and Arjuna the archer—there surely are splendor, victory, prosperity, and righteousness. The journey of 239 days ends here, but your practice begins fresh each morning. Carry what you have learned into every day.'
];

let output = '# Daily Short Reflections\n\n';
output += 'Practical 2-3 line wisdom based on each day\'s specific teaching.\n\n';

thoughtfulReflections.forEach((reflection, index) => {
  const day = index + 1;
  const snippet = data.snippets[index];
  const theme = snippet ? snippet.title.replace('Day ' + day + ': ', '') : '';
  output += '## Day ' + day + (theme ? ' - ' + theme : '') + '\n';
  output += reflection + '\n\n';
});

fs.writeFileSync(path.join(__dirname, '..', 'data', 'short_reflections.md'), output);

// Also create JSON for easy integration
const jsonOutput = thoughtfulReflections.map((reflection, index) => ({
  day: index + 1,
  shortReflection: reflection
}));

fs.writeFileSync(
  path.join(__dirname, '..', 'data', 'short_reflections.json'),
  JSON.stringify(jsonOutput, null, 2)
);

console.log('Created ' + thoughtfulReflections.length + ' thoughtful reflections');
console.log('Files: data/short_reflections.md and data/short_reflections.json');
