---
name: Feature request
description: Suggest an idea
labels: [enhancement]
body:
  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: Short description of the feature.
    validations:
      required: true
  - type: textarea
    id: motivation
    attributes:
      label: Motivation
      description: Why is this needed? Who benefits?
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: Proposal
      description: Outline of the proposed solution.
  - type: textarea
    id: acceptance
    attributes:
      label: Acceptance criteria
      description: Measurable criteria for success.
---
