import {
  Icon,
  Pivot,
  PivotItem,
  PrimaryButton,
  Stack,
  Text,
  TextField
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LoadingSpinner } from "../../shared/loading-spinner/LoadingSpinner";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import Navigation from "../../shared/navigation/Navigation";
import { Trip, TripStatus } from "./domain/Trip.types";
import { deleteTripById, fetchTrips, saveTripToApi } from "./infra/TripApi";
import { useMyTripListClasses } from "./MyTripList.styles";
import TripCard from "./TripCard";

interface TabConfig {
  status: TripStatus;
  label: string;
  emptyMessage: string;
  showCreateButton: boolean;
}

const TAB_CONFIG: TabConfig[] = [
  {
    status: "active",
    label: "Active",
    emptyMessage: "No active trips. Create your first trip to start planning!",
    showCreateButton: true
  },
  {
    status: "past",
    label: "Past",
    emptyMessage: "No past trips yet.",
    showCreateButton: false
  },
  {
    status: "archived",
    label: "Archived",
    emptyMessage: "No archived trips.",
    showCreateButton: false
  }
];

export const MyTripList: React.FC = () => {
  const classes = useMyTripListClasses();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState<TripStatus>("active");
  const [newTripName, setNewTripName] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [isDialogOpen, { setTrue: openDialog, setFalse: closeDialog }] =
    useBoolean(false);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBoolean(true);
  const [reloadData, { toggle: toggleReloadData }] = useBoolean(false);

  useEffect(() => {
    setLoading();
    fetchTrips(undefined, "DESC")
      .then(setTrips)
      .finally(setNotLoading);
  }, [reloadData]);

  const handleCreateTrip = async (): Promise<void> => {
    await saveTripToApi(newTripName.trim(), newStartDate, newEndDate);
    toggleReloadData();
  };

  const handleDelete = (id: number) => {
    deleteTripById(id).then(toggleReloadData);
  };

  const handleDialogDismiss = () => {
    setNewTripName("");
    setNewStartDate("");
    setNewEndDate("");
    closeDialog();
  };

  const visibleTrips = trips.filter((t) => t.status === activeTab);

  return (
    <>
      <Navigation />
      {isLoading && <LoadingSpinner text="Loading trips" />}
      {!isLoading && (
        <>
          <Stack className={classes.pageContainer}>
            <Stack
              horizontal
              horizontalAlign="space-between"
              verticalAlign="center"
              className={classes.pageHeader}
            >
              <Text className={classes.pageTitle}>My Trips</Text>
              <PrimaryButton
                iconProps={{ iconName: "Add" }}
                text="New Trip"
                onClick={openDialog}
              />
            </Stack>

            <Pivot
              selectedKey={activeTab}
              onLinkClick={(item) =>
                item?.props.itemKey && setActiveTab(item.props.itemKey as TripStatus)
              }
              styles={{ root: { marginBottom: 24 } }}
            >
              {TAB_CONFIG.map(({ status, label }) => {
                const count = trips.filter((t) => t.status === status).length;
                return (
                  <PivotItem
                    key={status}
                    itemKey={status}
                    headerText={`${label} (${count})`}
                  />
                );
              })}
            </Pivot>

            {visibleTrips.length === 0 ? (
              <Stack className={classes.emptyState} horizontalAlign="center">
                <Icon iconName="AirTickets" className={classes.emptyIcon} />
                <Text className={classes.emptyText}>
                  {TAB_CONFIG.find((t) => t.status === activeTab)?.emptyMessage}
                </Text>
                {TAB_CONFIG.find((t) => t.status === activeTab)?.showCreateButton && (
                  <PrimaryButton
                    iconProps={{ iconName: "Add" }}
                    text="Create Trip"
                    onClick={openDialog}
                  />
                )}
              </Stack>
            ) : (
              <Stack horizontal wrap tokens={{ childrenGap: 24 }}>
                {visibleTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onClick={() => navigate(`/my-trips/${trip.id}`)}
                    onDelete={() => handleDelete(trip.id)}
                  />
                ))}
              </Stack>
            )}
          </Stack>

          <EditProperty
            text="Trip"
            title="Create new Trip"
            editIconAriaLabel="Create new trip"
            isOpen={isDialogOpen}
            onDismiss={handleDialogDismiss}
            isFormValid={!!newTripName.trim() && !!newStartDate && !!newEndDate}
            onUpdateClick={handleCreateTrip}
          >
            <Stack tokens={{ childrenGap: 16 }}>
              <TextField
                label="Trip name"
                placeholder="e.g. Italy, Japan 2026"
                value={newTripName}
                onChange={(_e, val) => setNewTripName(val ?? "")}
              />
              <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 8 }}>
                <TextField
                  label="Start date"
                  type="date"
                  value={newStartDate}
                  onChange={(_e, val) => setNewStartDate(val ?? "")}
                  styles={{ root: { flex: 1 } }}
                />
                <Text className={classes.dateArrow}>{"\u2192"}</Text>
                <TextField
                  label="End date"
                  type="date"
                  value={newEndDate}
                  onChange={(_e, val) => setNewEndDate(val ?? "")}
                  styles={{ root: { flex: 1 } }}
                />
              </Stack>
            </Stack>
          </EditProperty>
        </>
      )}
    </>
  );
};

export default MyTripList;
