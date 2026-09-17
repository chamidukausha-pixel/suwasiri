export type PartnerLab = {
  name: string;
  address: string;
};

/** Destination labs reception can pick, or they can add a new name + address. */
export const DEFAULT_PARTNER_LABS: PartnerLab[] = [
  {
    name: "LankaLab - Colombo General",
    address: "Colombo Central Patholab, Baseline Road, Colombo 08",
  },
  {
    name: "LankaLab - Kandy Diagnostics",
    address: "Kandy Teaching Hospital Path Lab, William Gopallawa Mawatha, Kandy",
  },
  {
    name: "LankaLab - Galle Pathology Center",
    address: "Karapitiya Teaching Hospital Laboratory, Galle",
  },
  {
    name: "LankaLab - Jaffna Public Diagnostics",
    address: "Jaffna Teaching Hospital Laboratory, Hospital Road, Jaffna",
  },
  {
    name: "LankaLab - Negombo Quick Labs",
    address: "Negombo General Hospital Path Lab, St Joseph Street, Negombo",
  },
];
