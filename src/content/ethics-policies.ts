/** Shared publishing-ethics copy for public pages and in-workflow acknowledgements. */

export const AUTHOR_RESPONSIBILITIES = [
  'Submitted work is original and has not been published elsewhere.',
  'Manuscripts are not under consideration by another journal simultaneously.',
  'All listed authors have made substantial scholarly contributions to the work.',
  'Data presented are accurate, reliable, and honestly reported.',
  'Fabrication, falsification, plagiarism, image manipulation, and data manipulation are strictly prohibited.',
  'Appropriate acknowledgement is given to all sources.',
  'Necessary ethical approval has been obtained for research involving humans or animals.',
  'Conflicts of interest are disclosed at submission.',
  'Funding sources are declared.',
  'Authors cooperate fully during editorial investigations.',
  'Authors remain responsible for the accuracy of all information contained within their published work.',
] as const;

export const REVIEWER_RESPONSIBILITIES = [
  'Maintain confidentiality.',
  'Provide objective, constructive, and evidence-based reviews.',
  'Declare conflicts of interest.',
  'Identify relevant published work not cited.',
  'Report suspected plagiarism, duplicate publication, or ethical concerns.',
  'Complete reviews within agreed deadlines.',
] as const;

export const EDITOR_RESPONSIBILITIES = [
  'Evaluate manuscripts solely on academic merit.',
  'Maintain confidentiality throughout the review process.',
  'Avoid conflicts of interest.',
  'Select qualified independent reviewers.',
  'Ensure fairness, impartiality, and transparency.',
  'Take appropriate action where ethical concerns arise.',
  'Follow COPE guidance when investigating suspected misconduct.',
] as const;

export const EDITOR_DECISION_NON_DISCRIMINATION =
  "Editorial decisions shall not be influenced by authors' nationality, ethnicity, religion, gender, institutional affiliation, or political beliefs.";

export const CONFLICTS_OF_INTEREST = [
  'Authors, editors, and reviewers must disclose any financial, institutional, personal, or professional relationships that could influence the objectivity of the publication process.',
  'Where conflicts exist, appropriate management procedures shall be implemented.',
] as const;

export const AUTHORSHIP_CRITERIA = [
  'Conceptualisation',
  'Methodology',
  'Investigation',
  'Data analysis',
  'Writing',
  'Critical revision',
  'Final approval',
] as const;

export const AUTHORSHIP_ACKNOWLEDGEMENT =
  'Individuals who contributed only administrative, financial, technical, or language editing assistance should be acknowledged but not listed as authors.';

export const HUMAN_ANIMAL_RESEARCH = {
  intro:
    'Research involving human participants or animals must comply with recognised ethical standards and must have received approval from an appropriate ethics committee.',
  authorsShouldProvide: [
    'Ethics approval number',
    'Name of approving institution',
    'Statement confirming informed consent where applicable',
  ] as const,
};

export const RESEARCH_INTEGRITY_PROHIBITED = [
  'Plagiarism (similarity exceeding 15% may require revision or rejection)',
  'Fabricated data',
  'Falsified results',
  'Duplicate publication',
  'Citation manipulation',
  'Peer-review manipulation',
  'Paper mill submissions',
  'Undisclosed use of artificial intelligence in generating scientific findings',
] as const;

export const RESEARCH_INTEGRITY_CONSEQUENCES =
  "Any confirmed misconduct may result in rejection, correction, retraction, or notification of the author's institution.";

export const COMPLAINTS_AND_APPEALS = [
  'Authors may appeal editorial decisions by submitting a detailed written explanation to the Editor-in-Chief.',
  'Appeals shall be independently reviewed, and the final decision shall be communicated in writing.',
] as const;

export const CORRECTIONS_AND_RETRACTIONS_SUMMARY = [
  'MJSTEM publishes corrections, retractions, and expressions of concern where necessary to maintain the integrity of the scholarly record.',
  'Detailed procedures are provided in the Retraction, Corrections and Expressions of Concern Policy below.',
] as const;

export const ETHICAL_OVERSIGHT = [
  'The Editorial Board continuously monitors compliance with international publishing ethics.',
  'Serious ethical concerns are investigated according to COPE guidance.',
] as const;

export const RETRACTION_POLICY = {
  purpose:
    'MJSTEM is committed to preserving the integrity of the scholarly record. Corrections, retractions, and expressions of concern are issued when necessary to ensure that published literature remains accurate, transparent, and trustworthy.',
  correctionsMayBePublishedWhere: [
    'Typographical errors affect interpretation',
    'Author names require amendment',
    'Affiliations are incorrect',
    'References contain significant errors',
    'Minor factual inaccuracies exist',
  ] as const,
  correctionsNote: 'Corrections shall be permanently linked to the original article.',
  retractionEvidence: [
    'Plagiarism',
    'Duplicate publication',
    'Fabricated data',
    'Falsified findings',
    'Unethical research',
    'Serious methodological errors',
    'Copyright infringement',
    'Peer-review manipulation',
  ] as const,
  retractionNote:
    'Retracted articles shall remain accessible to preserve the scholarly record but will be clearly marked Retracted on every page.',
  expressionOfConcern:
    'Where investigations are ongoing and conclusive evidence is unavailable, MJSTEM may publish an Expression of Concern pending completion of the investigation.',
  investigationProcedure: [
    'Ethical concerns shall be investigated according to COPE guidance.',
    'Authors shall be given an opportunity to respond before a final decision is reached.',
    'Where appropriate, institutions or funding bodies may be notified.',
  ] as const,
};

export const DIGITAL_PRESERVATION_POLICY = {
  digitalPreservation: [
    'MJSTEM is committed to ensuring the permanent preservation and accessibility of all published scholarly content.',
    'The journal maintains secure electronic copies of all published articles and preserves the scholarly record through recognised digital preservation practices.',
    'Where applicable, published articles are assigned persistent Digital Object Identifiers (DOIs) to ensure long-term accessibility and citation stability.',
    'The journal continuously evaluates preservation technologies to ensure uninterrupted access for future generations of researchers.',
  ] as const,
  websiteBackup:
    'The journal website is regularly backed up to minimise the risk of data loss resulting from hardware failure, cyber-attacks, or unforeseen technical incidents.',
  permanentAccessibility:
    'Should publication cease, reasonable efforts will be made to ensure continued public access to previously published content through appropriate digital preservation arrangements.',
};

export const PUBLISHER_INFO = {
  journalName:
    'Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM)',
  publishedByPlaceholder: '[Full legal name of publisher — to be confirmed]',
  postalAddressLines: ['Postal address — to be confirmed', 'Nigeria'] as const,
  email: 'editor@mjstem.org',
  website: 'https://www.mjstem.org',
  editorialOffice:
    'Editorial correspondence should be directed to the Editor-in-Chief through the official journal email.',
  pendingNote:
    'Publisher legal name and postal address will be updated once provided by the editorial office.',
};

export const PLAGIARISM_POLICY = {
  intro:
    'MJSTEM maintains a zero-tolerance policy towards plagiarism and other forms of academic misconduct. Every submitted manuscript undergoes originality screening before peer review.',
  similarityScreening: [
    'Manuscripts are screened using Turnitin.',
    'A similarity index exceeding 15% may require revision or may result in rejection, depending on the nature of the overlap.',
    'Editorial assessment focuses on the quality and context of similarities rather than percentage alone.',
  ] as const,
  formsOfPlagiarism: [
    'Direct plagiarism',
    'Mosaic plagiarism',
    'Self-plagiarism',
    'Image plagiarism',
    'Data plagiarism',
    'Translation plagiarism',
    'Source concealment',
  ] as const,
  editorialProcedure: [
    'Initial assessment by the editorial office.',
    'Independent verification.',
    'Opportunity for author response.',
    'Editorial decision.',
    'Notification of institutions where necessary.',
  ] as const,
  consequences: [
    'Immediate rejection',
    'Retraction after publication',
    "Notification of authors' institutions",
    'Notification of funding agencies',
    'Temporary or permanent submission ban',
  ] as const,
  copeCompliance:
    'MJSTEM follows the guidance and flowcharts developed by the Committee on Publication Ethics (COPE) when investigating allegations of plagiarism or publication misconduct.',
};
