class PriorityService:

    def compute_priority(self, lab_label, sustained_instability):

        if lab_label == 1 and sustained_instability == 1:
            return "Critical"

        if lab_label == 1 and sustained_instability == 0:
            return "High"

        if lab_label is None and sustained_instability == 1:
            return "High"

        if lab_label == 0 and sustained_instability == 1:
            return "Medium"

        # "Normal" matches the Literal in PredictionResponse; "Low" did not.
        return "Normal"
