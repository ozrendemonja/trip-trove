import { InputField, InputFieldHandle } from "../../shared/ui/forms/InputField";
import {
  Button,
  MessageBar,
  MessageBarBody,
  Tab,
  TabList,
  Text
} from "@fluentui/react-components";
import { Add24Regular, TicketDiagonal24Regular } from "@fluentui/react-icons";
import { useBooleanState } from "../../shared/hooks/useBooleanState";
import React, { useEffect, useRef, useState } from "react";
import { generatePath, useNavigate } from "react-router";
import { LoadingSpinner } from "../../shared/loading-spinner/LoadingSpinner";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import Navigation from "../../shared/navigation/Navigation";
import { Trip, TripStatus } from "./domain/Trip.types";
import { deleteTripById, fetchTrips, saveTripToApi } from "./infra/TripApi";
import { useMyTripListClasses } from "./MyTripList.styles";
import TripCard from "./TripCard";
import ConfirmDeleteDialog from "../../shared/list-element/ui/delete-dialog/ConfirmDeleteDialog";
import EditTripDetails from "./EditTripDetails";
import { useSaveError } from "../../shared/hooks/UseSaveError";
import { Flex, FlexItem } from "../../shared/ui/Flex";

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
  const tripNameFieldRef = useRef<InputFieldHandle>(null);
  const {
    nameConflict: tripConflict,
    saveError,
    handleSaveError,
    clearSaveErrors
  } = useSaveError({
    nameConflictMessage:
      "A trip with this name already exists in the selected date range.",
    saveErrorMessage:
      "The trip wasn't created. Your details are still here, so you can review or edit them and try again.",
    focusRef: tripNameFieldRef,
    resetKey: `${newTripName}\u0000${newStartDate}\u0000${newEndDate}`
  });
  const [isDialogOpen, { setTrue: openDialog, setFalse: closeDialog }] =
    useBooleanState(false);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBooleanState(true);
  const [reloadData, { toggle: toggleReloadData }] = useBooleanState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [
    hideDeleteDialog,
    { setTrue: closeDeleteDialog, setFalse: openDeleteDialog }
  ] = useBooleanState(true);

  useEffect(() => {
    setLoading();
    fetchTrips(undefined, "DESC").then(setTrips).finally(setNotLoading);
  }, [reloadData]);

  const handleCreateTrip = async (): Promise<boolean> => {
    try {
      await saveTripToApi(newTripName.trim(), newStartDate, newEndDate);
    } catch (error) {
      handleSaveError(error);
      return false;
    }

    toggleReloadData();
    return true;
  };

  const handleDeleteRequest = (trip: Trip): void => {
    setTripToDelete(trip);
    openDeleteDialog();
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!tripToDelete) return;
    await deleteTripById(tripToDelete.id);
    toggleReloadData();
    closeDeleteDialog();
    setTripToDelete(null);
  };

  const handleDeleteDismiss = (): void => {
    closeDeleteDialog();
    setTripToDelete(null);
  };

  const handleDialogDismiss = () => {
    setNewTripName("");
    setNewStartDate("");
    setNewEndDate("");
    clearSaveErrors();
    closeDialog();
  };

  const visibleTrips = trips.filter((t) => t.status === activeTab);

  return (
    <>
      <Navigation />
      {isLoading && <LoadingSpinner text="Loading trips" />}
      {!isLoading && (
        <Flex className={classes.pageContainer}>
          <Flex
            direction="row"
            justify="space-between"
            align="center"
            className={classes.pageHeader}
          >
            <Text className={classes.pageTitle}>My Trips</Text>
            <Button
              appearance="primary"
              icon={<Add24Regular />}
              onClick={openDialog}
            >
              New Trip
            </Button>
          </Flex>

          <TabList
            selectedValue={activeTab}
            onTabSelect={(_event, data) =>
              setActiveTab(data.value as TripStatus)
            }
            style={{ marginBottom: 24 }}
          >
            {TAB_CONFIG.map(({ status, label }) => {
              const count = trips.filter((t) => t.status === status).length;
              return (
                <Tab key={status} value={status}>
                  {label} ({count})
                </Tab>
              );
            })}
          </TabList>

          {visibleTrips.length === 0 ? (
            <Flex className={classes.emptyState} justify="center">
              <TicketDiagonal24Regular className={classes.emptyIcon} />
              <Text className={classes.emptyText}>
                {TAB_CONFIG.find((t) => t.status === activeTab)?.emptyMessage}
              </Text>
              {TAB_CONFIG.find((t) => t.status === activeTab)
                ?.showCreateButton && (
                <Button
                  appearance="primary"
                  icon={<Add24Regular />}
                  onClick={openDialog}
                >
                  Create Trip
                </Button>
              )}
            </Flex>
          ) : (
            <Flex direction="row" wrap gap={24}>
              {visibleTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() =>
                    navigate(
                      generatePath("/my-trips/:tripId", {
                        tripId: String(trip.id)
                      })
                    )
                  }
                  onDelete={() => handleDeleteRequest(trip)}
                  onEdit={() => setTripToEdit(trip)}
                />
              ))}
            </Flex>
          )}
        </Flex>
      )}

      <EditProperty
        text="Trip"
        title="Create new Trip"
        editIconAriaLabel="Create new trip"
        isOpen={isDialogOpen}
        onDismiss={handleDialogDismiss}
        isFormValid={!!newTripName.trim() && !!newStartDate && !!newEndDate}
        onUpdateClick={handleCreateTrip}
        submitText="Create"
      >
        <Flex gap={16}>
          <InputField
            label="Trip name"
            placeholder="e.g. Italy, Japan 2026"
            value={newTripName}
            ref={tripNameFieldRef}
            errorMessage={tripConflict}
            onChange={(_e, val) => setNewTripName(val ?? "")}
          />
          <Flex direction="row" align="flex-end" gap={8}>
            <InputField
              label="Start date"
              type="date"
              value={newStartDate}
              onChange={(_e, val) => setNewStartDate(val ?? "")}
              className={classes.dateField}
            />
            <Text className={classes.dateArrow}>{"\u2192"}</Text>
            <InputField
              label="End date"
              type="date"
              value={newEndDate}
              onChange={(_e, val) => setNewEndDate(val ?? "")}
              className={classes.dateField}
            />
          </Flex>
          {saveError && (
            <MessageBar intent="error">
              <MessageBarBody>{saveError}</MessageBarBody>
            </MessageBar>
          )}
        </Flex>
      </EditProperty>

      <ConfirmDeleteDialog
        name={tripToDelete?.name ?? "trip"}
        hidden={hideDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onDismiss={handleDeleteDismiss}
      />

      {tripToEdit && (
        <EditTripDetails
          trip={tripToEdit}
          isOpen={true}
          onDismiss={() => setTripToEdit(null)}
          onUpdateClick={() => {
            setTripToEdit(null);
            toggleReloadData();
          }}
        />
      )}
    </>
  );
};

export default MyTripList;
