# Acceptance Boundary

The accepted boundary is the exact branch head for which all required PR checks and independent review are current. A subsequent push creates a new acceptance boundary and requires fresh evidence. Merge-queue admission then validates the temporary merge-group tree before `main` is updated.
