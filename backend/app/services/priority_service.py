class PriorityService:

    def compute_priority(self, lab_label, sustained_instability):
        priorities = {
            (1, 1): "Critical",
            (1, 0): "High",
            (None, 1): "High",
            (0, 1): "Medium",
        }
        return priorities.get((lab_label, sustained_instability), "Normal")
