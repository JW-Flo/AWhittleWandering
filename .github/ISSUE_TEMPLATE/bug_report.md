---
name: Bug report
description: Report a problem
labels: [bug]
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear and concise description of the bug.
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Provide clear steps to reproduce the issue.
      placeholder: |
        1. 
        2. 
        3. 
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: Actual behavior
    validations:
      required: true
  - type: input
    id: branch
    attributes:
      label: Branch
  - type: input
    id: env
    attributes:
      label: Environment
      placeholder: OS/Browser/Runtime versions
  - type: textarea
    id: additional
    attributes:
      label: Additional context
      description: Logs, screenshots, or extra details.
---
