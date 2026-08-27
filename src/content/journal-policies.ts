/**
 * Structured policy content for the Multidisciplinary Journal of Science, Technology,
 * Education and Management (MJSTEM). Consumed by the public policy pages under
 * `src/app/(public)/`. Content is kept faithful to the client editorial brief.
 *
 * Note: role-based workflow responsibilities (author/reviewer/editor) live in
 * `src/content/ethics-policies.ts` and are intentionally left there for workflow gates.
 */

// ---------------------------------------------------------------------------
// Shared journal identity / contact placeholders
// ---------------------------------------------------------------------------

const TO_BE_CONFIRMED = 'To be confirmed by the Editorial Office';

export const JOURNAL_IDENTITY = {
  journalName:
    'Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM)',
  journalShortName: 'MJSTEM',
  publisherName: 'Almustapha Technical Research Consultant',
  publisherEmail: 'almustaphatrc@gmail.com',
  academicAffiliation: TO_BE_CONFIRMED,
  location: TO_BE_CONFIRMED,
  nature: TO_BE_CONFIRMED,
  /** Editorial office contact (manuscript / editorial correspondence) */
  contactEmail: 'mjstem2025@gmail.com',
  postalAddress: [
    'No. 11 Katsina Road, Old Airport Quarters Minna, Niger State, Nigeria.',
    'P O Box 323, Minna Niger state Nigeria',
  ],
  website: 'https://www.mjstem.org/',
  country: 'Nigeria',
} as const;

// ---------------------------------------------------------------------------
// Peer Review Policy (full — sections 1–14)
// ---------------------------------------------------------------------------

export const PEER_REVIEW_POLICY = {
  intro:
    'The Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM) operates a rigorous peer-review system to ensure that all scholarly articles published in the journal meet appropriate standards of academic quality, methodological soundness, originality, relevance and ethical research practice. MJSTEM uses a double-blind peer-review process. The identities of authors and reviewers are kept confidential throughout the review process, except where disclosure is required by law, ethical investigation, or other legitimate scholarly considerations.',
  sections: [
    {
      id: 'purpose',
      title: '1. Purpose',
      body: [
        'The Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM) operates a rigorous peer-review system to ensure that all scholarly articles published in the journal meet appropriate standards of academic quality, methodological soundness, originality, relevance and ethical research practice.',
        'MJSTEM uses a double-blind peer-review process. The identities of authors and reviewers are kept confidential throughout the review process, except where disclosure is required by law, ethical investigation, or other legitimate scholarly considerations.',
      ],
    },
    {
      id: 'initial-editorial-assessment',
      title: '2. Initial Editorial Assessment',
      body: [
        'All manuscripts submitted to MJSTEM are first examined by the Editorial Office to determine whether the submission:',
        '1. falls within the scope of the journal;',
        '2. complies with the journal\'s submission requirements;',
        '3. contains sufficient scholarly content;',
        '4. satisfies basic standards of academic writing and presentation;',
        '5. complies with the journal\'s ethical requirements;',
        '6. has not been submitted simultaneously to another journal; and',
        '7. contains no apparent evidence of plagiarism, fabrication, falsification or other research misconduct.',
        'The Editor-in-Chief or a designated editor may reject a manuscript without external peer review where it is clearly outside the journal\'s scope, fails to meet essential submission requirements, lacks sufficient scholarly merit, or presents a significant ethical concern.',
      ],
    },
    {
      id: 'external-peer-review',
      title: '3. External Peer Review',
      body: [
        'Manuscripts that pass the initial editorial assessment are sent to at least two independent reviewers with appropriate subject expertise.',
        'Reviewers must have sufficient academic or professional expertise in the subject of the manuscript and must be independent of the authors and their institutions.',
        'A reviewer must decline an assignment where a conflict of interest, personal relationship, institutional relationship, financial interest, recent collaboration, supervisory relationship or other circumstance could reasonably affect the objectivity of the review.',
      ],
    },
    {
      id: 'reviewer-selection',
      title: '4. Reviewer Selection',
      body: [
        'Reviewers are selected by the Editor-in-Chief or an authorised member of the editorial team based on:',
        'subject expertise;',
        'relevant research experience;',
        'publication record where appropriate;',
        'methodological competence;',
        'absence of identifiable conflicts of interest; and',
        'availability to provide an objective and timely assessment.',
        'Authors may suggest potential reviewers, but the final selection of reviewers remains the responsibility of the journal. Suggested reviewers may be used only where the Editorial Office determines that they are suitably qualified and independent.',
      ],
    },
    {
      id: 'review-criteria',
      title: '5. Review Criteria',
      body: [
        'Reviewers are requested to assess manuscripts according to criteria appropriate to the discipline, including:',
        'originality and contribution to knowledge;',
        'clarity of the research problem and objectives;',
        'adequacy of the literature review;',
        'theoretical or conceptual foundation;',
        'methodological appropriateness;',
        'validity and reliability of the methods where applicable;',
        'quality of analysis;',
        'accuracy and interpretation of findings;',
        'coherence of conclusions;',
        'relevance to the journal\'s scope;',
        'ethical compliance;',
        'quality of presentation; and',
        'adequacy of references.',
        'Reviewers provide constructive comments that can assist authors in improving their manuscripts.',
      ],
    },
    {
      id: 'editorial-decisions',
      title: '6. Editorial Decisions',
      body: [
        'Following peer review, the editor may make one of the following decisions: Accept; Accept subject to minor revisions; Revise and resubmit for further review (major revision); or Reject.',
        'Editors may therefore request minor revision, major revision / revise and resubmit for further review, or reject the manuscript.',
        'A manuscript may be returned to the reviewers after revision where the editor considers further assessment necessary.',
        'The final publication decision rests with the Editor-in-Chief or an appropriately delegated editor. Peer reviewers provide scholarly recommendations, but the final decision remains an editorial responsibility and is not determined solely by a reviewer\'s recommendation.',
      ],
    },
    {
      id: 'reviewers-disagreement',
      title: '7. Reviewers\' Disagreement',
      body: [
        'Where reviewers provide substantially conflicting recommendations, the editor may:',
        'seek clarification from the existing reviewers;',
        'appoint an additional independent reviewer; or',
        'make an editorial decision based on the available evidence and the manuscript\'s scholarly merits.',
        'The appointment of an additional reviewer does not guarantee acceptance.',
      ],
    },
    {
      id: 'special-issues',
      title: '8. Special Issues and Themed Collections',
      body: [
        'Articles submitted for special issues or themed collections are subject to the same quality-control and peer-review requirements as regular submissions.',
        'Guest editors may coordinate the review process, but the Editor-in-Chief retains responsibility for ensuring that the journal\'s peer-review standards are applied consistently.',
      ],
    },
    {
      id: 'editorial-board-as-authors',
      title: '9. Editorial Board Members and Editors as Authors',
      body: [
        'Editors and editorial board members may submit manuscripts to MJSTEM. Such manuscripts are subject to the same peer-review requirements as manuscripts submitted by other authors.',
        'An editor who is an author of a manuscript must not participate in the editorial decision concerning that manuscript. The manuscript shall be assigned to an independent editor who has no conflict of interest with the authors.',
      ],
    },
    {
      id: 'confidentiality',
      title: '10. Confidentiality',
      body: [
        'Reviewers must treat manuscripts received for review as confidential documents. They must not disclose, copy, distribute, use or exploit unpublished information contained in a manuscript for personal or professional advantage.',
        'Reviewers must not transfer a manuscript to another person without prior permission from the journal.',
      ],
    },
    {
      id: 'reviewer-conduct',
      title: '11. Reviewer Conduct',
      body: [
        'Reviewers are expected to provide objective, respectful and evidence-based assessments. Personal criticism of authors is inappropriate.',
        'Reviewers must disclose any potential conflict of interest and must decline the review where impartiality cannot reasonably be maintained.',
      ],
    },
    {
      id: 'review-records',
      title: '12. Review Records',
      body: [
        'MJSTEM maintains appropriate editorial and peer-review records for submitted manuscripts. Review records may be retained for purposes of quality assurance, publication-ethics investigations, appeals, corrections and retractions.',
      ],
    },
    {
      id: 'ethical-and-professional-standards',
      title: '13. Ethical and Professional Standards',
      body: [
        'MJSTEM\'s peer-review process is guided by recognised principles of publication ethics, including relevant guidance from the Committee on Publication Ethics (COPE).',
        'The journal reserves the right to investigate suspected manipulation of the peer-review process, fraudulent reviewer identities, fabricated reviews or other forms of publication misconduct.',
      ],
    },
    {
      id: 'review-timeline',
      title: '14. Review Timeline',
      body: [
        'MJSTEM endeavours to process manuscripts efficiently while allowing reviewers sufficient time to provide a meaningful scholarly assessment. Review timelines may vary according to subject area, reviewer availability, manuscript complexity and the need for additional review.',
        'Authors may contact the Editorial Office regarding the status of a manuscript where a reasonable period has elapsed without an editorial update.',
      ],
    },
  ],
} as const;

// Shorter summary for the dedicated Peer Review Policy page intro / hub cards.
export const PEER_REVIEW_POLICY_SUMMARY = {
  intro:
    'MJSTEM operates a rigorous double-blind external peer-review system to ensure the scholarly quality, originality, methodological soundness and ethical integrity of published research.',
  points: [
    'Each research article is evaluated by at least two independent reviewers with appropriate subject expertise.',
    'Reviewers must be independent of the authors and must have no personal, professional, institutional, financial or other conflict of interest that could compromise the objectivity of their assessment.',
    'The identities of authors and reviewers are normally kept confidential throughout the review process.',
    'Following peer review, the editor may decide to accept the manuscript, request minor revisions, request major revisions and further review, or reject the manuscript.',
    'The final publication decision rests with the Editor-in-Chief or an appropriately delegated editor. Peer reviewers provide scholarly recommendations, but the final decision remains an editorial responsibility.',
    'Where reviewers provide substantially conflicting recommendations, the editor may seek clarification, obtain an additional independent review, or make a decision based on the available evidence and the manuscript\'s scholarly merit.',
    'Editors and editorial board members may submit manuscripts to MJSTEM, but they must not participate in the editorial decision concerning their own manuscripts. Such manuscripts are assigned to an independent editor without a conflict of interest.',
    'Reviewers are required to maintain confidentiality and must not use, reproduce, distribute or disclose unpublished information contained in manuscripts under review.',
    'The journal may investigate suspected peer-review manipulation, fraudulent reviewer identities, fabricated reviews or other forms of review misconduct in accordance with its publication-ethics procedures.',
    'MJSTEM\'s peer-review process is conducted in accordance with recognised principles of scholarly publishing ethics and relevant guidance from the Committee on Publication Ethics (COPE).',
  ],
} as const;

// ---------------------------------------------------------------------------
// Publication Frequency
// ---------------------------------------------------------------------------

export const PUBLICATION_FREQUENCY = {
  summary:
    'MJSTEM is published quarterly, with four issues scheduled for publication in each calendar year. The journal publishes scholarly research articles, review articles and other scholarly contributions that fall within its stated scope. The publication schedule may be adjusted where necessary because of editorial, technical or exceptional circumstances. Any significant change to the publication schedule will be communicated through the journal website.',
} as const;

// ---------------------------------------------------------------------------
// Authorship and Contributorship
// ---------------------------------------------------------------------------

export const AUTHORSHIP_AND_CONTRIBUTORSHIP = {
  intro:
    'MJSTEM follows internationally recognised criteria for authorship to ensure that credit and accountability are appropriately assigned.',
  criteriaIntro:
    'Authorship should be based on substantial contribution to the work. All those designated as authors should meet the following criteria:',
  criteria: [
    'Substantial contributions to the conception or design of the work, or the acquisition, analysis, or interpretation of data.',
    'Drafting the work or revising it critically for important intellectual content.',
    'Final approval of the version to be published.',
    'Agreement to be accountable for all aspects of the work in ensuring that questions related to its accuracy or integrity are appropriately investigated and resolved.',
  ],
  acknowledgement:
    'Individuals who contributed only administrative, financial, technical, or language-editing assistance should be acknowledged but not listed as authors.',
  correspondingAuthor:
    'One author is designated as the corresponding author and is responsible for communication with the journal throughout submission, review, and publication, and for ensuring that all co-authors have approved the final manuscript and its author list.',
  changesToAuthorship:
    'Any request to add, remove, or reorder authors after submission must be made in writing to the editorial office and must be approved by all authors, including the author being added or removed. The editorial office reserves the right to request evidence of each author’s contribution.',
} as const;

// ---------------------------------------------------------------------------
// Conflict of Interest Policy (full)
// ---------------------------------------------------------------------------

export const CONFLICT_OF_INTEREST_POLICY = {
  intro:
    'A conflict of interest exists when professional judgement concerning a primary interest (such as the validity of research) may be influenced by a secondary interest (such as financial or personal considerations). MJSTEM requires the full disclosure of all potential conflicts of interest.',
  authors: [
    'Authors must disclose all financial and non-financial relationships that could be perceived as influencing the reported work, including funding, employment, consultancies, patents, and personal relationships.',
    'Where no conflict exists, authors should include a statement to that effect.',
  ],
  reviewers: [
    'Reviewers must decline any manuscript in which they have a conflict of interest and must disclose any relationship that could bias their assessment.',
  ],
  editors: [
    'Editors must not handle manuscripts in which they have a conflict of interest; such manuscripts are reassigned to another editor.',
    'Editorial decisions must be free from commercial or personal influence.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Complaints Policy
// ---------------------------------------------------------------------------

export const COMPLAINTS_POLICY = {
  intro:
    'MJSTEM takes all complaints seriously and is committed to addressing them promptly, fairly, and transparently.',
  points: [
    'Complaints regarding editorial processes, publication ethics, or the conduct of editors, reviewers, or staff should be submitted in writing to the Editor-in-Chief.',
    'Complaints are acknowledged and investigated in a fair and timely manner, in accordance with COPE guidance.',
    'The outcome of the investigation is communicated to the complainant in writing.',
    'Where a complaint reveals a systemic issue, the journal will take appropriate corrective action.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Appeals Policy
// ---------------------------------------------------------------------------

export const APPEALS_POLICY = {
  intro:
    'Authors have the right to appeal editorial decisions where they believe an error has been made or that the decision did not adequately reflect the merits of their work.',
  points: [
    'Appeals must be submitted in writing to the Editor-in-Chief, setting out clearly the grounds for the appeal and responding to the points raised during review.',
    'Appeals are considered independently of the original decision-making process.',
    'The Editor-in-Chief may consult additional reviewers or editorial board members before reaching a decision.',
    'The final decision on an appeal is communicated to the author in writing and is binding.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Data Availability Policy
// ---------------------------------------------------------------------------

export const DATA_AVAILABILITY_POLICY = {
  intro:
    'MJSTEM encourages transparency and reproducibility in research by promoting the sharing of data underlying published findings.',
  points: [
    'Authors are encouraged to include a data availability statement indicating whether and how the data supporting the results can be accessed.',
    'Where possible, data should be deposited in a recognised public repository and cited in the manuscript.',
    'Where data cannot be shared for legal, ethical, or privacy reasons, authors should state the reason in the data availability statement.',
    'Editors and reviewers may request access to underlying data during the review process to verify findings.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Editorial Independence
// ---------------------------------------------------------------------------

export const EDITORIAL_INDEPENDENCE = {
  intro:
    'MJSTEM maintains full editorial independence. Editorial decisions are based solely on the scholarly merit of submitted work and are not influenced by commercial, political, institutional, or personal interests.',
  points: [
    'The Editor-in-Chief has final authority over all editorial content and decisions.',
    'Decisions to accept or reject manuscripts are made independently of the publisher and any funding or sponsoring bodies.',
    'Advertising, reprints, or commercial partnerships do not influence editorial decisions.',
    'Editorial decisions are never influenced by the nationality, ethnicity, religion, gender, seniority, or institutional affiliation of the authors.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Manuscript Withdrawal
// ---------------------------------------------------------------------------

export const MANUSCRIPT_WITHDRAWAL = {
  intro:
    'Authors are discouraged from withdrawing manuscripts after submission, as review consumes valuable editorial and reviewer resources. However, the journal recognises that withdrawal may occasionally be necessary.',
  points: [
    'Requests to withdraw a manuscript must be made in writing to the editorial office and signed by all authors.',
    'A manuscript may be withdrawn without penalty before the peer review process begins.',
    'Withdrawal requests made during or after peer review are considered on a case-by-case basis and require a clear justification.',
    'Manuscripts may not be withdrawn after acceptance except in exceptional and justified circumstances approved by the Editor-in-Chief.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Publication Ethics and Integrity
// ---------------------------------------------------------------------------

export const PUBLICATION_ETHICS_AND_INTEGRITY = {
  intro:
    'MJSTEM is committed to upholding the highest standards of publication ethics and research integrity. The journal adheres to the principles and core practices of the Committee on Publication Ethics (COPE).',
  points: [
    'All parties involved in the publication process — authors, editors, reviewers, and the publisher — are expected to observe recognised ethical standards.',
    'The journal does not tolerate plagiarism, data fabrication or falsification, image manipulation, duplicate or redundant publication, citation manipulation, or peer-review manipulation.',
    'Allegations of misconduct are investigated in accordance with COPE guidance, and authors are given an opportunity to respond before any decision is reached.',
    'Confirmed misconduct may result in rejection, correction, retraction, or notification of the author’s institution and funding bodies.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Corrections and Retractions (updated — Zenodo)
// ---------------------------------------------------------------------------

export const CORRECTIONS_AND_RETRACTIONS = {
  intro:
    'MJSTEM is committed to maintaining the integrity of the scholarly record. Corrections, retractions, and expressions of concern are issued where necessary to ensure that the published literature remains accurate, transparent, and trustworthy.',
  corrections: {
    intro: 'Corrections may be published where:',
    items: [
      'Typographical or production errors affect the interpretation of the article.',
      'Author names or affiliations require amendment.',
      'References contain significant errors.',
      'Minor factual inaccuracies exist that do not affect the overall findings.',
    ],
    note: 'Corrections are permanently linked to the original article so that the corrected record is clearly visible to readers.',
  },
  retractions: {
    intro: 'An article may be retracted where evidence demonstrates:',
    items: [
      'Plagiarism or duplicate publication.',
      'Fabricated or falsified data or findings.',
      'Unethical research or serious methodological errors.',
      'Copyright infringement or peer-review manipulation.',
    ],
    note: 'Retracted articles remain accessible to preserve the scholarly record but are clearly marked as “Retracted” on every page.',
  },
  expressionOfConcern:
    'Where an investigation is ongoing and conclusive evidence is not yet available, MJSTEM may publish an Expression of Concern pending completion of the investigation.',
  archivingNote:
    'Where articles have been archived in Zenodo, the version of record and any associated corrections or retraction notices are maintained so that the complete and accurate history of the article is preserved.',
} as const;

// ---------------------------------------------------------------------------
// Digital Preservation (updated — Zenodo)
// ---------------------------------------------------------------------------

export const DIGITAL_PRESERVATION = {
  intro:
    'MJSTEM is committed to the permanent preservation and continued accessibility of all published scholarly content.',
  points: [
    'Published articles are deposited and archived in Zenodo, an open-access repository operated by CERN, ensuring long-term preservation and stable access.',
    'The journal maintains secure electronic copies of all published articles and preserves the scholarly record through recognised digital preservation practices.',
    'Where applicable, published articles are assigned persistent Digital Object Identifiers (DOIs) to ensure long-term accessibility and citation stability.',
    'The journal website is regularly backed up to minimise the risk of data loss from hardware failure, cyber-attacks, or unforeseen technical incidents.',
  ],
  permanentAccessibility:
    'Should publication cease, the archiving of content in Zenodo ensures that previously published work remains permanently and publicly accessible.',
} as const;

// ---------------------------------------------------------------------------
// AI Policy (updated — generative AI)
// ---------------------------------------------------------------------------

export const AI_POLICY = {
  intro:
    'MJSTEM recognises the growing role of generative artificial intelligence (AI) tools in research and writing and requires their responsible and transparent use.',
  points: [
    'Generative AI and AI-assisted technologies cannot be listed as authors, as they cannot take responsibility or be accountable for the content of a manuscript.',
    'AI tools may be used to assist with language and readability, but authors remain fully responsible for the originality, accuracy, and integrity of their work.',
    'Any use of generative AI in the preparation of a manuscript must be disclosed in the methods or acknowledgements section, describing the tool used and how it was applied.',
    'The use of AI to fabricate, alter, or manipulate data, results, or images is strictly prohibited.',
    'Undisclosed use of artificial intelligence in generating scientific findings is treated as research misconduct.',
    'Reviewers must not upload manuscripts or any part of them to generative AI tools, as this breaches confidentiality.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Open Access Policy
// ---------------------------------------------------------------------------

export const OPEN_ACCESS_POLICY = {
  intro:
    'MJSTEM is a fully open-access journal. All articles are freely available online immediately upon publication, without subscription, registration, or payment barriers for readers.',
  points: [
    'All content is published under a Creative Commons Attribution 4.0 International License (CC BY 4.0).',
    'Readers are free to read, download, copy, distribute, print, search, and link to the full text of all articles.',
    'Authors retain copyright of their work and grant MJSTEM the right to publish and distribute the work as the original publisher.',
    'Open access maximises the visibility, reach, and impact of published research and supports the global advancement of knowledge.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Copyright and Licensing
// ---------------------------------------------------------------------------

export const COPYRIGHT_LICENSING = {
  intro:
    'Authors retain full copyright of their work published in MJSTEM. There is no transfer of copyright to the journal.',
  licenseName: 'Creative Commons Attribution 4.0 International License (CC BY 4.0)',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  points: [
    'All articles are published under the Creative Commons Attribution 4.0 International License (CC BY 4.0).',
    'This license allows others to distribute, remix, adapt, and build upon the work, even commercially, provided appropriate credit is given to the original author(s).',
    'Authors grant MJSTEM the right to publish and distribute their work online as the original publisher.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Publication Charges (no APC)
// ---------------------------------------------------------------------------

export const PUBLICATION_CHARGES = {
  summary:
    'MJSTEM does not charge any fees for submission, processing, or publication. There are no Article Processing Charges (APCs) and no submission fees. The journal is committed to open access for all, without financial barriers for authors or readers.',
} as const;

// ---------------------------------------------------------------------------
// Publisher Information (with address)
// ---------------------------------------------------------------------------

export const PUBLISHER_INFO = {
  journalName: JOURNAL_IDENTITY.journalName,
  publisherName: JOURNAL_IDENTITY.publisherName,
  postalAddress: JOURNAL_IDENTITY.postalAddress,
  contactEmail: JOURNAL_IDENTITY.publisherEmail,
  editorialEmail: JOURNAL_IDENTITY.contactEmail,
  website: JOURNAL_IDENTITY.website,
  country: JOURNAL_IDENTITY.country,
  statement:
    'The Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM) is published by Almustapha Technical Research Consultant, as identified in the authoritative ISSN record. The publisher provides the organisational, technical and administrative infrastructure necessary for the publication and preservation of the journal.',
} as const;

// ---------------------------------------------------------------------------
// Academic Affiliation (placeholders)
// ---------------------------------------------------------------------------

export const ACADEMIC_AFFILIATION = {
  affiliation: JOURNAL_IDENTITY.academicAffiliation,
  location: JOURNAL_IDENTITY.location,
  nature: JOURNAL_IDENTITY.nature,
  note: 'Details of the journal’s academic affiliation will be confirmed and published by the Editorial Office.',
} as const;

// ---------------------------------------------------------------------------
// Aims and Scope
// ---------------------------------------------------------------------------

export const AIMS_AND_SCOPE = {
  aims: [
    'The Multidisciplinary Journal of Science, Technology, Education and Management (MJSTEM) is an international, peer-reviewed, open-access journal dedicated to the rapid publication of high-quality, original research.',
    'The journal aims to provide a reputable platform for the dissemination of research findings across science, technology, education, and management, and to foster interdisciplinary collaboration and the cross-pollination of ideas.',
    'MJSTEM is committed to advancing knowledge that addresses contemporary challenges and to making scholarly research freely and openly accessible to a global audience.',
  ],
  subjectAreas: [
    'Engineering and Technology',
    'Life Sciences and Biology',
    'Physical Sciences',
    'Computer Science & AI',
    'Educational Theory and Practice',
    'Higher Education Management',
    'Business and Economics',
    'Public Administration',
    'Social Sciences and Humanities',
    'Health and Medical Sciences',
    'Technical Vocational Education and Training (TVET)',
    'Cyber Security',
    'Science Education',
    'Educational Technology',
    'Data Science',
    'Library and Information Technology/Science',
  ],
} as const;

// ---------------------------------------------------------------------------
// Editorial Responsibility
// ---------------------------------------------------------------------------

export const EDITORIAL_RESPONSIBILITY = {
  intro:
    'The Editorial Board of MJSTEM is responsible for maintaining the academic quality and ethical integrity of the journal.',
  points: [
    'Editors evaluate manuscripts solely on their intellectual merit, without regard to the authors’ personal characteristics or affiliations.',
    'Editors ensure a fair, unbiased, and timely peer review process.',
    'Editors maintain the confidentiality of submitted manuscripts and related correspondence.',
    'Editors take appropriate action when ethical concerns arise, following COPE guidance.',
    'Editors safeguard the independence and integrity of the published record.',
  ],
} as const;

// ---------------------------------------------------------------------------
// Indexing and Abstracting
// ---------------------------------------------------------------------------

export const INDEXING_AND_ABSTRACTING = {
  summary:
    'MJSTEM is working towards inclusion in recognised indexing and abstracting services to maximise the discoverability and reach of published research. Current and prospective indexing details will be confirmed and published by the Editorial Office as they are secured.',
} as const;

// ---------------------------------------------------------------------------
// Archival Policy
// ---------------------------------------------------------------------------

export const ARCHIVAL_POLICY = {
  summary:
    'MJSTEM archives all published content in Zenodo, an open-access repository operated by CERN, to ensure the long-term preservation and permanent accessibility of the scholarly record. The journal also maintains secure electronic backups of all published articles.',
} as const;

// ---------------------------------------------------------------------------
// Publication Ethics Hub — shorter bullet summaries
// ---------------------------------------------------------------------------

export const PUBLICATION_ETHICS_HUB_SUMMARIES = {
  apc: 'MJSTEM does not charge any submission, processing, or publication fees. There are no Article Processing Charges (APCs).',
  copyright:
    'Authors retain full copyright of their work. All articles are published under the Creative Commons Attribution 4.0 International License (CC BY 4.0).',
  plagiarism:
    'All manuscripts are screened for originality. The acceptable similarity level is 15%, assessed in context — editorial decisions focus on the nature of any overlap rather than the percentage alone. Submissions exceeding this threshold may be returned for revision or rejected.',
  researchMisconduct:
    'The journal does not tolerate fabrication, falsification, plagiarism, image manipulation, citation manipulation, peer-review manipulation, or paper-mill submissions. Allegations are investigated following COPE guidance.',
  peerReview:
    'MJSTEM operates a double-blind peer review process. See the dedicated Peer Review Policy for full details.',
  authorship:
    'Authorship reflects substantial intellectual contribution to the work. All listed authors must approve the final manuscript and agree to be accountable for it.',
  conflictOfInterest:
    'Authors, editors, and reviewers must disclose any financial, personal, institutional, or professional relationships that could bias the publication process.',
  funding:
    'Authors must declare all sources of funding for the reported research, including grant numbers where applicable.',
  researchEthics:
    'Research involving human participants or animals must comply with recognised ethical standards and have received approval from an appropriate ethics committee, with informed consent obtained where applicable.',
  dataAvailability:
    'Authors are encouraged to provide a data availability statement and, where possible, to deposit underlying data in a recognised public repository.',
  corrections:
    'Corrections, retractions, and expressions of concern are issued where necessary, following COPE guidance, and are permanently linked to the original article.',
  complaints:
    'Complaints about editorial processes or publication ethics may be submitted in writing to the Editor-in-Chief and are investigated fairly and promptly.',
  digitalPreservation:
    'Published content is archived in Zenodo (operated by CERN) and backed up regularly to ensure long-term preservation and access.',
  ai: 'Generative AI cannot be listed as an author. Any use of AI in manuscript preparation must be disclosed, and undisclosed use to generate scientific findings is treated as misconduct.',
  editorialIndependence:
    'Editorial decisions are based solely on scholarly merit and are free from commercial, political, or institutional influence.',
  cope: 'MJSTEM adheres to the principles and core practices of the Committee on Publication Ethics (COPE).',
} as const;
