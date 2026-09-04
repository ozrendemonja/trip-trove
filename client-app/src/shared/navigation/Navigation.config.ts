import { NavigationSection } from "./NavigationMenu";
import {
  Board24Regular,
  CloudArrowUp24Regular,
  Location24Regular,
  Luggage24Regular,
  Save24Regular,
  Search24Regular,
  Star24Regular,
  Settings24Regular
} from "@fluentui/react-icons";
import React from "react";

export const navLinkGroups = (expanded: boolean): NavigationSection[] => [
  {
    items: [
      {
        label: "Search",
        path: "/",
        icon: React.createElement(Search24Regular)
      },
      {
        label: "My trips",
        path: "/my-trips",
        id: "my-trips-key",
        icon: React.createElement(Luggage24Regular)
      },
      {
        label: "Organizer",
        path: "#",
        id: "organizer-key",
        icon: React.createElement(Location24Regular)
      },
      {
        label: "Bucket list",
        path: "/bucket-list",
        id: "bucket-list-key",
        icon: React.createElement(Star24Regular)
      }
    ]
  },
  {
    label: "Administrative",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: React.createElement(Board24Regular),
        id: "dashboard-key",
        items: [
          {
            label: "Attractions",
            path: "/attractions",
            id: "attractions-key"
          },
          {
            label: "City",
            path: "/cities",
            id: "city-key"
          },
          {
            label: "Region",
            path: "/regions",
            id: "region-key"
          },
          {
            label: "Country",
            path: "/countries",
            id: "country-key"
          },
          {
            label: "Continent",
            path: "/continents",
            id: "continent-key"
          }
        ],
        expanded,
        toggleOnly: true
      },
      {
        label: "Backup",
        path: "#",
        id: "backup-key",
        icon: React.createElement(Save24Regular)
      },
      {
        label: "Upload",
        path: "#",
        icon: React.createElement(CloudArrowUp24Regular),
        id: "upload-key"
      }
    ]
  },
  {
    label: "Menage",
    items: [
      {
        label: "Account",
        path: "#",
        icon: React.createElement(Settings24Regular),
        id: "dashboard-key"
      }
    ]
  }
];
