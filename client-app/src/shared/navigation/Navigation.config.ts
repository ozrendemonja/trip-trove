import { INavLinkGroup } from "@fluentui/react";

export const navLinkGroups = (expandLinks: boolean): INavLinkGroup[] => [
  {
    links: [
      {
        name: "Search",
        url: "/",
        icon: "Search",
        target: "_blank"
      },
      {
        name: "My trips",
        url: "#",
        key: "my-trips-key",
        icon: "AirTickets",
        target: "_blank"
      },
      {
        name: "Organizer",
        url: "#",
        key: "organizer-key",
        icon: "MapPin",
        target: "_blank"
      }
    ]
  },
  {
    name: "Administrative",
    links: [
      {
        name: "Dashboard",
        url: "/",
        icon: "ViewDashboard",
        key: "dashboard-key",
        target: "_blank",
        links: [
          {
            name: "Attractions",
            url: "/attractions",
            key: "attractions-key",
            target: "_blank"
          },
          {
            name: "City",
            url: "/cities",
            key: "city-key",
            target: "_blank"
          },
          {
            name: "Region",
            url: "/regions",
            key: "region-key",
            target: "_blank"
          },
          {
            name: "Country",
            url: "/countries",
            key: "country-key",
            target: "_blank"
          },
          {
            name: "Continent",
            url: "/continents",
            key: "continent-key",
            target: "_blank"
          }
        ],
        isExpanded: expandLinks,
        blockCallToUrl: true
      },
      {
        name: "Backup",
        url: "#",
        key: "backup-key",
        icon: "Save",
        target: "_blank"
      },
      {
        name: "Upload",
        url: "#",
        icon: "CloudUpload",
        key: "upload-key",
        target: "_blank"
      }
    ]
  },
  {
    name: "Menage",
    links: [
      {
        name: "Account",
        url: "#",
        icon: "Settings",
        key: "dashboard-key",
        target: "_blank"
      }
    ]
  }
];
