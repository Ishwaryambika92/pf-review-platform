export type Lang = "en" | "te";

/**
 * Flat-ish dictionary, one entry per UI string.
 * User-generated review content is NEVER translated.
 */


export const dict = {
  en: {
    // =========================
    // NAVIGATION
    // =========================
    nav_services: "Services",
    nav_staff_login: "Staff Login",
    nav_moderation: "Moderation",
    nav_logout: "Log out",
    nav_my_reviews: "My Reviews",

    // =========================
    // HERO
    // =========================
    hero_eyebrow: "Verified reviews, calculated live from our database",
    hero_title_1: "PF Service Experiences.",
    hero_title_2: "Verified reviews. Better decisions.",
    hero_subtitle:
      "Discover customer experiences, compare ratings and make informed decisions before choosing a PF service.",
    hero_explore: "Explore Reviews",
    hero_write: "Write a Review",
    search_placeholder:
      "Search “PF withdrawal”, “UAN service”, “KYC update”…",

    // =========================
    // TRUST
    // =========================
    trust_verified_title: "Verified Reviews",
    trust_verified_desc: "Evidence reviewed by our moderation team",

    trust_transparent_title: "Transparent Ratings",
    trust_transparent_desc: "Calculated directly from approved reviews",

    trust_proof_title: "Proof-Based Verification",
    trust_proof_desc: "Receipts & confirmations, never guesswork",

    trust_secure_title: "Secure & Private",
    trust_secure_desc: "Original documents are never made public",

    trust_community_title: "Community Driven",
    trust_community_desc: "Real customers comparing real experiences",

    // =========================
    // SERVICES
    // =========================
    services_loading: "Loading services…",
    services_error:
      "Couldn't load services. Is the backend running?",
    services_empty: "No services found.",

    reviews_count_suffix: "reviews",
    based_on: "Based on",
    reviews_word: "reviews",
    no_reviews_for_service:
      "No reviews yet for this service.",
    verified_experiences: "Verified Experiences",

    // =========================
    // REVIEWS
    // =========================
    customer_experiences: "Customer Experiences",
    filter_all: "All",
    filter_verified: "Verified",
    sort_newest: "Newest",
    sort_highest: "Highest Rated",
    sort_lowest: "Lowest Rated",

    reviews_loading: "Loading reviews…",
    reviews_error: "Couldn't load reviews right now.",
    reviews_empty_verified:
      "No verified reviews available yet.",
    reviews_empty_all: "No reviews found.",

    badge_verified: "Verified Experience",
    badge_unverified: "Unverified",
    proof_verified: "Proof Verified",

    verified_tooltip:
      "Supporting evidence was reviewed by our moderation team. Personal or sensitive information is never displayed publicly.",

    helpful: "Helpful",
    report: "Report",

    // =========================
    // REPORT
    // =========================
    report_review_title: "Report review",
    report_reason_fake: "Fake review",
    report_reason_spam: "Spam",
    report_reason_offensive: "Offensive content",
    report_reason_misleading: "Misleading information",
    report_reason_personal_info: "Personal information",
    report_reason_duplicate: "Duplicate review",
    report_reason_other: "Other",

    report_details_placeholder: "Optional details",
    report_submit: "Submit report",
    report_thanks:
      "Thanks — our moderation team will look into this.",
    report_error:
      "Couldn't submit report. You may have already reported this review.",

    please_login_helpful:
      "Please log in to mark a review as helpful.",

    // =========================
    // FOOTER
    // =========================
    footer_disclaimer:
      "Real customer reviews, verified through our moderation process.",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms",
    footer_review_policy: "Review Policy",

    // =========================
    // REVIEW SUBMISSION
    // =========================
    form_title: "Write a review",

    step_service: "Service",
    step_rating: "Rating",
    step_review: "Review",
    step_proof: "Proof",
    step_privacy: "Privacy",
    step_submit: "Submit",

    field_service: "Service / provider",
    field_service_date: "Date of service",

    field_reviewer_name: "Your name (optional)",
    field_reviewer_name_placeholder: "e.g. Priya K.",

    field_anonymous:
      'Post anonymously (shown as "Anonymous", or "Verified Customer" once verified)',

    field_overall_rating: "Overall rating",
    field_quality: "Service Quality",
    field_communication: "Communication",
    field_transparency: "Transparency",
    field_value: "Value for Money",

    field_title: "Review title",
    field_title_placeholder:
      "Example: PF withdrawal process was smooth",

    field_body: "Detailed experience",

    field_body_helper:
      "Describe what happened, how the service was handled, what was helpful, and what could be improved.",

    what_should_i_write: "What should I write?",

    what_should_i_write_body:
      "Tell us about your actual experience. You can mention:\n" +
      "- What service you used\n" +
      "- Why you contacted the service\n" +
      "- How the process went\n" +
      "- How helpful the support was\n" +
      "- Any problems or delays\n" +
      "- What could be improved",

    example_review:
      "Example:\n" +
      "I used the PF Withdrawal Support service recently. The support team explained " +
      "the required documents clearly and helped me understand the process. My issue " +
      "was resolved, although the response took a little longer than expected.",

    genuine_notice:
      "Please share only your genuine experience.",

    // =========================
    // EXPERIENCE SECTION
    // =========================
    review_experience_title: "Tell us about your experience",

    review_experience_hint:
      "Briefly tell us what happened and how your experience was.",

    required: "Required",
    optional: "Optional",

    field_pros: "What went well?",
    field_pros_hint:
      "What did you like about the service?",
    field_pros_placeholder:
      "Example: The support was helpful and the process was easy to understand.",

    field_cons: "What could be improved?",
    field_cons_hint:
      "Was there anything that could have been better?",
    field_cons_placeholder:
      "Example: The response could have been faster.",

    field_recommend:
      "Would you recommend this service?",

    recommend_service:
      "Would you recommend this service?",

    yes: "Yes",
    maybe: "Maybe",
    no: "No",

    // =========================
    // RECOMMENDATION EMOJIS
    // =========================
    recommendation_yes_emoji: "😊",
    recommendation_maybe_emoji: "🤔",
    recommendation_no_emoji: "😕",

    recommendation_yes_message:
      "Great! We're happy to hear that! 😊",

    recommendation_maybe_message:
      "Thanks for your honest feedback. 🤔",

    recommendation_no_message:
      "We appreciate your honesty. We'll use your feedback to improve. 😕",

    // =========================
    // PROOF
    // =========================
    proof_warning:
      "Please hide or redact sensitive information such as Aadhaar numbers, bank account numbers, passwords and OTPs before uploading proof.",

    proof_upload_label:
      "Upload receipt, invoice or confirmation (JPG, PNG, PDF, max 8MB)",

    proof_optional_note:
      "Proof is optional, but helps your review qualify for verification.",

    privacy_notice:
      "Your uploaded proof stays private. Only authorized moderators can view it — it is never published or made downloadable publicly.",

    privacy_indicator_question:
      'Do you allow us to display a privacy-safe "Proof Verified" indicator with your review?',

    privacy_indicator_yes:
      "Yes, show indicator",

    privacy_indicator_no:
      "No, keep private",

    // =========================
    // BUTTONS
    // =========================
    back: "Back",
    cancel: "Cancel",
    continue: "Continue",
    submitting: "Submitting…",
    submit_review: "Submit review",

    submitted_title: "Submitted for verification",

    submitted_body:
      "Your review has been submitted for verification. We'll notify you once our moderation team has reviewed it.",

    reference_id: "Reference ID",
    done: "Done",

    submit_generic_error:
      "Couldn't submit your review. Please check the form and try again.",

    // =========================
    // VALIDATION
    // =========================
    val_service_required:
      "Please select a service.",

    val_rating_required:
      "Please give an overall rating.",

    val_title_required:
      "Please enter your review title.",

    val_body_required:
      "Please describe your experience (at least a few words).",

    val_recommend_required:
      "Please choose whether you would recommend this service.",

    // =========================
    // REVIEW FLOW COMPATIBILITY KEYS
    // =========================
    val_recommendation_required:
      "Please select whether you would recommend this service.",

    field_body_placeholder:
      "Example: The process was explained clearly and the support was helpful.",

    what_went_well:
      "What went well?",

    what_went_well_hint:
      "What did you like about the service?",

    what_went_well_placeholder:
      "Example: The support was helpful and the process was easy to understand.",

    what_could_improve:
      "What could be improved?",

    what_could_improve_hint:
      "Was there anything that could have been better?",

    what_could_improve_placeholder:
      "Example: The response could have been faster.",
  },

  // ============================================================
  // TELUGU
  // ============================================================

  te: {
    // =========================
    // NAVIGATION
    // =========================
    nav_services: "సేవలు",
    nav_staff_login: "సిబ్బంది లాగిన్",
    nav_moderation: "మోడరేషన్",
    nav_logout: "లాగ్ అవుట్",
    nav_my_reviews: "నా రివ్యూలు",

    // =========================
    // HERO
    // =========================
    hero_eyebrow:
      "వెరిఫైడ్ రివ్యూలు, మా డేటాబేస్ నుండి ప్రత్యక్షంగా లెక్కించబడ్డాయి",

    hero_title_1:
      " PF సేవా అనుభవాలు.",

    hero_title_2:
      "వెరిఫైడ్ రివ్యూలు. మెరుగైన నిర్ణయాలు.",

    hero_subtitle:
      "కస్టమర్ అనుభవాలను తెలుసుకోండి, రేటింగ్‌లను పోల్చండి మరియు PF సేవను ఎంచుకునే ముందు సమాచారంతో కూడిన నిర్ణయం తీసుకోండి.",

    hero_explore: "రివ్యూలు చూడండి",
    hero_write: "రివ్యూ రాయండి",

    search_placeholder:
      "వెతకండి “PF withdrawal”, “UAN service”, “KYC update”…",

    // =========================
    // TRUST
    // =========================
    trust_verified_title: "వెరిఫైడ్ రివ్యూలు",
    trust_verified_desc:
      "మా మోడరేషన్ టీమ్ ఆధారాలను సమీక్షించింది",

    trust_transparent_title:
      "పారదర్శక రేటింగ్‌లు",

    trust_transparent_desc:
      "ఆమోదించిన రివ్యూల నుండి నేరుగా లెక్కించబడ్డాయి",

    trust_proof_title:
      "ప్రూఫ్-ఆధారిత వెరిఫికేషన్",

    trust_proof_desc:
      "రసీదులు & నిర్ధారణలు, ఊహాగానాలు కాదు",

    trust_secure_title:
      "సురక్షితం & ప్రైవేట్",

    trust_secure_desc:
      "అసలు పత్రాలు ఎప్పుడూ పబ్లిక్‌గా చేయబడవు",

    trust_community_title:
      "కమ్యూనిటీ ఆధారితం",

    trust_community_desc:
      "నిజమైన కస్టమర్లు నిజమైన అనుభవాలను పోల్చుతారు",

    // =========================
    // SERVICES
    // =========================
    services_loading:
      "సేవలు లోడ్ అవుతున్నాయి…",

    services_error:
      "సేవలను లోడ్ చేయలేకపోయాము. బ్యాకెండ్ రన్ అవుతోందా?",

    services_empty:
      "సేవలు కనుగొనబడలేదు.",

    reviews_count_suffix: "రివ్యూలు",
    based_on: "ఆధారంగా",
    reviews_word: "రివ్యూలు",

    no_reviews_for_service:
      "ఈ సేవకు ఇంకా రివ్యూలు లేవు.",

    verified_experiences:
      "వెరిఫైడ్ అనుభవాలు",

    // =========================
    // REVIEWS
    // =========================
    customer_experiences:
      "కస్టమర్ అనుభవాలు",

    filter_all: "అన్నీ",
    filter_verified: "వెరిఫైడ్",
    sort_newest: "కొత్తవి",
    sort_highest: "అధిక రేటింగ్",
    sort_lowest: "తక్కువ రేటింగ్",

    reviews_loading:
      "రివ్యూలు లోడ్ అవుతున్నాయి…",

    reviews_error:
      "ప్రస్తుతం రివ్యూలను లోడ్ చేయలేకపోయాము.",

    reviews_empty_verified:
      "ఇంకా వెరిఫైడ్ రివ్యూలు అందుబాటులో లేవు.",

    reviews_empty_all:
      "రివ్యూలు కనుగొనబడలేదు.",

    badge_verified:
      "వెరిఫైడ్ అనుభవం",

    badge_unverified:
      "అన్‌వెరిఫైడ్",

    proof_verified:
      "ప్రూఫ్ వెరిఫైడ్",

    verified_tooltip:
      "సపోర్టింగ్ ఆధారాలను మా మోడరేషన్ టీమ్ సమీక్షించింది. వ్యక్తిగత లేదా సున్నితమైన సమాచారం ఎప్పుడూ పబ్లిక్‌గా చూపబడదు.",

    helpful: "ఉపయోగకరం",
    report: "రిపోర్ట్",

    // =========================
    // REPORT
    // =========================
    report_review_title:
      "రివ్యూను రిపోర్ట్ చేయండి",

    report_reason_fake:
      "నకిలీ రివ్యూ",

    report_reason_spam:
      "స్పామ్",

    report_reason_offensive:
      "అభ్యంతరకరమైన కంటెంట్",

    report_reason_misleading:
      "తప్పుదారి పట్టించే సమాచారం",

    report_reason_personal_info:
      "వ్యక్తిగత సమాచారం",

    report_reason_duplicate:
      "డూప్లికేట్ రివ్యూ",

    report_reason_other:
      "ఇతరం",

    report_details_placeholder:
      "ఐచ్ఛిక వివరాలు",

    report_submit:
      "రిపోర్ట్ సమర్పించండి",

    report_thanks:
      "ధన్యవాదాలు — మా మోడరేషన్ టీమ్ దీన్ని పరిశీలిస్తుంది.",

    report_error:
      "రిపోర్ట్ సమర్పించలేకపోయాము. మీరు ఇప్పటికే ఈ రివ్యూను రిపోర్ట్ చేసి ఉండవచ్చు.",

    please_login_helpful:
      "రివ్యూను ఉపయోగకరంగా గుర్తించడానికి దయచేసి లాగిన్ అవ్వండి.",

    // =========================
    // FOOTER
    // =========================
    footer_disclaimer:
      "నిజమైన కస్టమర్ రివ్యూలు, మా మోడరేషన్ ప్రక్రియ ద్వారా వెరిఫై చేయబడ్డాయి.",

    footer_privacy:
      "గోప్యతా విధానం",

    footer_terms:
      "నిబంధనలు",

    footer_review_policy:
      "రివ్యూ విధానం",

    // =========================
    // REVIEW SUBMISSION
    // =========================
    form_title:
      "రివ్యూ రాయండి",

    step_service:
      "సేవ",

    step_rating:
      "రేటింగ్",

    step_review:
      "రివ్యూ",

    step_proof:
      "ప్రూఫ్",

    step_privacy:
      "గోప్యత",

    step_submit:
      "సమర్పించండి",

    field_service:
      "సేవ / ప్రొవైడర్",

    field_service_date:
      "సేవ తేదీ",

    field_reviewer_name:
      "మీ పేరు (ఐచ్ఛికం)",

    field_reviewer_name_placeholder:
      "ఉదా. ప్రియ కె.",

    field_anonymous:
      'అనామకంగా పోస్ట్ చేయండి ("Anonymous" గా చూపబడుతుంది, వెరిఫై అయ్యాక "Verified Customer" గా చూపబడుతుంది)',

    field_overall_rating:
      "మొత్తం రేటింగ్",

    field_quality:
      "సేవా నాణ్యత",

    field_communication:
      "కమ్యూనికేషన్",

    field_transparency:
      "పారదర్శకత",

    field_value:
      "విలువ (డబ్బుకు తగ్గ సేవ)",

    field_title:
      "రివ్యూ శీర్షిక",

    field_title_placeholder:
      "ఉదాహరణ: PF withdrawal process చాలా సులభంగా జరిగింది",

    field_body:
      "మీ అనుభవాన్ని వివరించండి",

    field_body_helper:
      "మీకు ఎదురైన నిజమైన అనుభవాన్ని వివరించండి. సేవ ఎలా ఉంది, ఏది ఉపయోగపడింది, ఏమైనా సమస్యలు లేదా ఆలస్యం జరిగిందా, ఏం మెరుగుపరచవచ్చో రాయండి.",

    what_should_i_write:
      "ఏం రాయాలి?",

    what_should_i_write_body:
      "మీ నిజమైన అనుభవం గురించి రాయండి. ఉదాహరణకు:\n" +
      "- మీరు ఏ సేవను ఉపయోగించారు\n" +
      "- ఎందుకు ఆ సేవను సంప్రదించారు\n" +
      "- ప్రక్రియ ఎలా జరిగింది\n" +
      "- సపోర్ట్ ఎంతవరకు సహాయపడింది\n" +
      "- ఏమైనా సమస్యలు లేదా ఆలస్యాలు వచ్చాయా\n" +
      "- ఇంకా ఏం మెరుగుపరచవచ్చు",

    example_review:
      "ఉదాహరణ:\n" +
      "నేను ఇటీవల PF Withdrawal Support సేవను ఉపయోగించాను. అవసరమైన documents " +
      "మరియు process గురించి support team నాకు స్పష్టంగా వివరించారు. నా సమస్య " +
      "పరిష్కరించబడింది, అయితే response రావడానికి కొంచెం సమయం పట్టింది.",

    genuine_notice:
      "దయచేసి మీకు నిజంగా ఎదురైన అనుభవాన్ని మాత్రమే రాయండి.",

    // =========================
    // EXPERIENCE SECTION
    // =========================
    review_experience_title:
      "మీ అనుభవం గురించి చెప్పండి",

    review_experience_hint:
      "ఏం జరిగింది మరియు మీ అనుభవం ఎలా ఉందో క్లుప్తంగా చెప్పండి.",

    required:
      "అవసరం",

    optional:
      "ఐచ్ఛికం",

    field_pros:
      "ఏది బాగా జరిగింది?",

    field_pros_hint:
      "ఈ సేవలో మీకు ఏది నచ్చింది?",

    field_pros_placeholder:
      "ఉదాహరణ: సపోర్ట్ బాగా సహాయపడింది మరియు ప్రక్రియ అర్థం చేసుకోవడం సులభంగా ఉంది.",

    field_cons:
      "ఏమి మెరుగుపరచవచ్చు?",

    field_cons_hint:
      "ఇంకా ఏదైనా మెరుగ్గా ఉండాల్సి ఉందా?",

    field_cons_placeholder:
      "ఉదాహరణ: స్పందన మరింత త్వరగా వచ్చి ఉంటే బాగుండేది.",

    field_recommend:
      "మీరు ఈ సేవను సిఫారసు చేస్తారా?",

    recommend_service:
      "మీరు ఈ సేవను సిఫారసు చేస్తారా?",

    yes:
      "అవును",

    maybe:
      "బహుశా",

    no:
      "లేదు",

    // =========================
    // RECOMMENDATION EMOJIS
    // =========================
    recommendation_yes_emoji:
      "😊",

    recommendation_maybe_emoji:
      "🤔",

    recommendation_no_emoji:
      "😕",

    recommendation_yes_message:
      "చాలా బాగుంది! మీరు ఈ సేవతో సంతృప్తిగా ఉన్నందుకు సంతోషంగా ఉంది! 😊",

    recommendation_maybe_message:
      "మీ నిజాయితీగల అభిప్రాయానికి ధన్యవాదాలు. 🤔",

    recommendation_no_message:
      "మీ నిజాయితీని మేము అభినందిస్తున్నాము. మీ ఫీడ్‌బ్యాక్‌తో సేవను మెరుగుపరచడానికి ప్రయత్నిస్తాము. 😕",

    // =========================
    // PROOF
    // =========================
    proof_warning:
      "ప్రూఫ్ అప్‌లోడ్ చేసే ముందు Aadhaar నంబర్లు, బ్యాంక్ ఖాతా నంబర్లు, పాస్‌వర్డ్‌లు మరియు OTPలు వంటి సున్నితమైన సమాచారాన్ని దాచండి లేదా తొలగించండి.",

    proof_upload_label:
      "రసీదు, ఇన్‌వాయిస్ లేదా నిర్ధారణను అప్‌లోడ్ చేయండి (JPG, PNG, PDF, గరిష్టంగా 8MB)",

    proof_optional_note:
      "ప్రూఫ్ ఐచ్ఛికం, కానీ మీ రివ్యూ వెరిఫికేషన్‌కు అర్హత పొందడానికి సహాయపడుతుంది.",

    privacy_notice:
      "మీరు అప్‌లోడ్ చేసిన ప్రూఫ్ ప్రైవేట్‌గా ఉంటుంది. అధీకృత మోడరేటర్లు మాత్రమే దీన్ని చూడగలరు — ఇది ఎప్పుడూ పబ్లిక్‌గా ప్రచురించబడదు లేదా డౌన్‌లోడ్ చేయబడదు.",

    privacy_indicator_question:
      'మీ రివ్యూతో పాటు గోప్యత-సురక్షిత "Proof Verified" సూచికను చూపించడానికి మీరు అనుమతిస్తారా?',

    privacy_indicator_yes:
      "అవును, సూచికను చూపించండి",

    privacy_indicator_no:
      "లేదు, ప్రైవేట్‌గా ఉంచండి",

    // =========================
    // BUTTONS
    // =========================
    back:
      "వెనుకకు",

    cancel:
      "రద్దు చేయండి",

    continue:
      "కొనసాగించండి",

    submitting:
      "సమర్పిస్తోంది…",

    submit_review:
      "రివ్యూ సమర్పించండి",

    submitted_title:
      "వెరిఫికేషన్ కోసం సమర్పించబడింది",

    submitted_body:
      "మీ రివ్యూ వెరిఫికేషన్ కోసం సమర్పించబడింది. మా మోడరేషన్ టీమ్ దీన్ని సమీక్షించిన తర్వాత మేము మీకు తెలియజేస్తాము.",

    reference_id:
      "రిఫరెన్స్ ID",

    done:
      "పూర్తయింది",

    submit_generic_error:
      "మీ రివ్యూను సమర్పించలేకపోయాము. దయచేసి ఫారమ్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",

    // =========================
    // VALIDATION
    // =========================
    val_service_required:
      "దయచేసి ఒక సేవను ఎంచుకోండి.",

    val_rating_required:
      "దయచేసి మొత్తం రేటింగ్ ఇవ్వండి.",

    val_title_required:
      "దయచేసి మీ రివ్యూ శీర్షికను నమోదు చేయండి.",

    val_body_required:
      "దయచేసి మీ అనుభవాన్ని వివరించండి (కనీసం కొన్ని పదాలు).",

    val_recommend_required:
      "దయచేసి మీరు ఈ సేవను సిఫారసు చేస్తారా లేదా అనేది ఎంచుకోండి.",

    // =========================
    // REVIEW FLOW COMPATIBILITY KEYS
    // =========================
    val_recommendation_required:
      "దయచేసి మీరు ఈ సేవను సిఫారసు చేస్తారా లేదా అనేది ఎంచుకోండి.",

    field_body_placeholder:
      "ఉదాహరణ: ప్రక్రియను స్పష్టంగా వివరించారు మరియు సహాయం ఉపయోగకరంగా ఉంది.",

    what_went_well:
      "ఏది బాగా జరిగింది?",

    what_went_well_hint:
      "ఈ సేవలో మీకు ఏది నచ్చింది?",

    what_went_well_placeholder:
      "ఉదాహరణ: సపోర్ట్ బాగా సహాయపడింది మరియు ప్రక్రియ అర్థం చేసుకోవడం సులభంగా ఉంది.",

    what_could_improve:
      "ఏం మెరుగుపరచవచ్చు?",

    what_could_improve_hint:
      "ఇంకా ఏదైనా మెరుగ్గా ఉండాల్సి ఉందా?",

    what_could_improve_placeholder:
      "ఉదాహరణ: స్పందన మరింత త్వరగా వచ్చి ఉంటే బాగుండేది.",
  },
} as const;

export type TranslationKey = keyof typeof dict["en"];