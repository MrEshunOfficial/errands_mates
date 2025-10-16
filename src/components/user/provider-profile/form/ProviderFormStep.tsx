import React from "react";
import {
  Phone,
  Mail,
  AlertCircle,
  Building2,
  Shield,
  Clock,
  Percent,
  Check,
  Loader2,
  ToolCase,
  ArrowLeft,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProviderProfileFormData } from "./ProviderProfileFormLogic";
import { useUserService } from "@/hooks/public/services/use-service";

// Types
interface WorkingHours {
  start: string;
  end: string;
}

interface StepProps {
  formData: Partial<ProviderProfileFormData>;
  updateFieldValue: (field: string, value: unknown) => void;
  validationErrors: Record<string, string[]>;
  clearFieldError: (field: string) => void;
}

// Personal Info Step Component
export const PersonalInfoStep: React.FC<StepProps> = ({
  formData,
  updateFieldValue,
  validationErrors,
  clearFieldError,
}) => {
  const handleInputChange = (field: string, value: string | boolean) => {
    updateFieldValue(field, value);
    clearFieldError(field);
  };

  return (
    <div className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Business Name
        </Label>
        <Input
          value={formData.businessName || ""}
          onChange={(e) => handleInputChange("businessName", e.target.value)}
          placeholder="Enter your business name"
        />
        {validationErrors["businessName"] && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationErrors["businessName"][0]}
            </AlertDescription>
          </Alert>
        )}
      </div>
      {/* Business Contact */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-red-500" />
          Business Contact
        </Label>
        <Input
          type="tel"
          value={formData.providerContactInfo?.businessContact || ""}
          onChange={(e) =>
            handleInputChange(
              "providerContactInfo.businessContact",
              e.target.value
            )
          }
          placeholder="+233 XX XXX XXXX"
        />
        <p className="text-sm text-muted-foreground">
          This will be your main business contact
        </p>
        {validationErrors["providerContactInfo.businessContact"] && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationErrors["providerContactInfo.businessContact"][0]}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Business Email */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Business Email
        </Label>
        <Input
          type="email"
          value={formData.providerContactInfo?.businessEmail || ""}
          onChange={(e) =>
            handleInputChange(
              "providerContactInfo.businessEmail",
              e.target.value
            )
          }
          placeholder="business@example.com"
        />
        {validationErrors["providerContactInfo.businessEmail"] && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationErrors["providerContactInfo.businessEmail"][0]}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

// Schedule & Availability Step Component
export const ScheduleAndAvailabilityStep: React.FC<StepProps> = ({
  formData,
  updateFieldValue,
  clearFieldError,
}) => {
  const handleInputChange = (
    field: string,
    value: string | WorkingHours | boolean
  ) => {
    updateFieldValue(field, value);
    clearFieldError(field);
  };

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const toggleDayAvailability = (day: string) => {
    const currentHours = formData.workingHours || {};
    const dayHours = currentHours[day];

    if (dayHours) {
      // Remove the day from working hours
      const updatedHours = { ...currentHours };
      delete updatedHours[day];
      updateFieldValue("workingHours", updatedHours);
    } else {
      // Add the day with default hours
      handleInputChange(`workingHours.${day}`, {
        start: "09:00",
        end: "17:00",
      });
    }
  };

  const updateDayTime = (
    day: string,
    timeType: "start" | "end",
    value: string
  ) => {
    const currentHours = formData.workingHours || {};
    const dayHours = currentHours[day] || {
      start: "09:00",
      end: "17:00",
    };

    handleInputChange(`workingHours.${day}`, {
      ...dayHours,
      [timeType]: value,
    });
  };

  const isAlwaysAvailable = formData.isAlwaysAvailable ?? false;

  return (
    <div className="space-y-6">
      {/* Availability Toggles */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Currently Available</Label>
              <p className="text-sm text-muted-foreground">
                Indicate whether you are currently available for work
              </p>
            </div>
            <Switch
              checked={formData.isCurrentlyAvailable ?? false}
              onCheckedChange={(checked) =>
                handleInputChange("isCurrentlyAvailable", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Always Available (24/7)</Label>
              <p className="text-sm text-muted-foreground">
                Enable if you operate 24/7 - working hours will not be required
              </p>
            </div>
            <Switch
              checked={isAlwaysAvailable}
              onCheckedChange={(checked) =>
                handleInputChange("isAlwaysAvailable", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Hours - Only show if NOT always available */}
      {!isAlwaysAvailable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Working Hours
            </CardTitle>
            <CardDescription>
              Set your weekly schedule. Select the days you&apos;re available
              and specify your working hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {daysOfWeek.map((day) => {
              const dayHours = formData.workingHours?.[day];
              const isAvailable = !!dayHours;

              return (
                <Card
                  key={day}
                  className={isAvailable ? "border-green-500" : ""}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={isAvailable}
                            onCheckedChange={() => toggleDayAvailability(day)}
                          />
                          <Label className="capitalize">{day}</Label>
                        </div>
                        {!isAvailable && (
                          <span className="text-sm text-muted-foreground">
                            Unavailable
                          </span>
                        )}
                      </div>

                      {isAvailable && dayHours && (
                        <div className="grid grid-cols-2 gap-3 ml-8">
                          <div className="space-y-2">
                            <Label className="text-xs">Start Time</Label>
                            <Input
                              type="time"
                              value={dayHours.start}
                              onChange={(e) =>
                                updateDayTime(day, "start", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">End Time</Label>
                            <Input
                              type="time"
                              value={dayHours.end}
                              onChange={(e) =>
                                updateDayTime(day, "end", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Alert>
              <AlertDescription>
                💡 Tip: Set your regular working hours. You can always adjust
                availability for specific dates later.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 24/7 Availability Info */}
      {isAlwaysAvailable && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            <strong>24/7 Availability Enabled</strong> - You won&apos;t need to
            set specific working hours since you&apos;re available around the
            clock.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Credentials Step Component
export const CredentialsStep: React.FC<StepProps> = ({
  formData,
  updateFieldValue,
  clearFieldError,
}) => {
  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    updateFieldValue(field, value);
    clearFieldError(field);
  };

  return (
    <div className="space-y-6">
      {/* Deposit Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Deposit Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Initial Deposit?</Label>
              <p className="text-sm text-muted-foreground">
                Ask customers for a partial payment before starting work.
              </p>
            </div>
            <Switch
              checked={formData.requireInitialDeposit ?? false}
              onCheckedChange={(checked) =>
                handleInputChange("requireInitialDeposit", checked)
              }
            />
          </div>

          {formData.requireInitialDeposit && (
            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Deposit Percentage
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enter the percentage of the total cost customers must pay
                  upfront.
                </p>
              </div>

              <Input
                type="number"
                value={formData.percentageDeposit || ""}
                onChange={(e) =>
                  handleInputChange(
                    "percentageDeposit",
                    parseFloat(e.target.value)
                  )
                }
                placeholder="0.00"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Required Initial Deposit
            </span>
            <span className="font-medium">
              {formData.requireInitialDeposit
                ? `${formData.percentageDeposit || 0}%`
                : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Currently Available:</span>
            <span className="font-medium">
              {formData.isCurrentlyAvailable ? "✓ Yes" : "✗ No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">24/7 Availability:</span>
            <span className="font-medium">
              {formData.isAlwaysAvailable ? "✓ Yes" : "✗ No"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Services Offered Step Component
export const ServicesOfferedStep: React.FC<StepProps> = ({
  formData,
  updateFieldValue,
  validationErrors,
  clearFieldError,
}) => {
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<string[]>(
    formData.serviceOfferings?.map((s) => s._id) || []
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showUserServicesOnly, setShowUserServicesOnly] = React.useState(false);

  const handleServiceSelection = (serviceId: string) => {
    const newSelection = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId];

    setSelectedServiceIds(newSelection);
    updateFieldValue(
      "serviceOfferings",
      newSelection.map((id) => ({ _id: id }))
    );
    clearFieldError("serviceOfferings");
  };

  const handleCreateServiceRedirect = () => {
    window.location.href = "/service-offered/create?returnTo=provider-profile";
  };

  if (showCreateForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToolCase className="w-5 h-5" />
            Create New Service
          </CardTitle>
          <CardDescription>
            Create a new service to add to your provider profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You&apos;ll be redirected to the service creation form. After
              creating your service, return here to select it for your provider
              profile.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>You&apos;ll be taken to the service creation form</li>
                <li>Fill in your service details and submit</li>
                <li>Return to this page to continue</li>
                <li>Select your newly created service from the list</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Selection</span>
              </button>
              <button
                type="button"
                onClick={handleCreateServiceRedirect}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Go to Service Form</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToolCase className="w-5 h-5" />
            Services Offered
          </CardTitle>
          <CardDescription>
            Select existing services or create your own to add to your provider
            profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {validationErrors["serviceOfferings"] && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationErrors["serviceOfferings"][0]}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your Own Service</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowUserServicesOnly(!showUserServicesOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showUserServicesOnly
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showUserServicesOnly ? "My Services" : "All Services"}
              </span>
            </button>
          </div>

          {/* Service Selector */}
          <ServiceSelector
            selectedServiceIds={selectedServiceIds}
            onServiceSelect={handleServiceSelection}
            searchQuery={searchQuery}
            showUserServicesOnly={showUserServicesOnly}
          />

          {/* Selected Count */}
          {selectedServiceIds.length > 0 && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {selectedServiceIds.length} service(s) selected
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface ServiceSelectorProps {
  selectedServiceIds: string[];
  onServiceSelect: (serviceId: string) => void;
  searchQuery: string;
  showUserServicesOnly: boolean;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedServiceIds,
  onServiceSelect,
  searchQuery,
  showUserServicesOnly,
}) => {
  const { services, userServices, isLoading, getAllServices, getUserServices } =
    useUserService();

  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadServices = async () => {
      try {
        if (showUserServicesOnly) {
          await getUserServices();
        } else {
          await getAllServices({ limit: 100 });
        }
        setHasLoaded(true);
      } catch (error) {
        console.error("Error loading services:", error);
        setHasLoaded(true);
      }
    };

    loadServices();
  }, [showUserServicesOnly, getAllServices, getUserServices]);

  const displayServices = showUserServicesOnly ? userServices : services;

  const filteredServices = React.useMemo(() => {
    if (!searchQuery) return displayServices;

    const query = searchQuery.toLowerCase();
    return displayServices.filter(
      (service) =>
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
    );
  }, [displayServices, searchQuery]);

  if (isLoading || !hasLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground">
          Loading {showUserServicesOnly ? "your" : "all"} services...
        </p>
      </div>
    );
  }

  if (filteredServices.length === 0) {
    if (showUserServicesOnly) {
      return (
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <strong>No services found.</strong>{" "}
            {searchQuery
              ? "Try adjusting your search or "
              : "Click 'Create Your Own Service' to add your first service, or "}
            switch to &quot;All Services&quot; to browse available options.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          {searchQuery ? (
            <>
              <strong>No services match your search.</strong> Try different
              keywords or create your own service.
            </>
          ) : (
            <>
              <strong>No services available.</strong> Click &quot;Create Your
              Own Service&quot; to add one.
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {showUserServicesOnly
          ? "Select from your services:"
          : "Select services to offer:"}{" "}
        ({filteredServices.length} available)
      </div>
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
        {filteredServices.map((service) => {
          const isSelected = selectedServiceIds.includes(
            service._id.toString()
          );

          return (
            <Card
              key={service._id.toString()}
              className={`cursor-pointer transition-all p-2 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                  : "hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-sm"
              }`}
              onClick={() => onServiceSelect(service._id.toString())}
            >
              <CardContent className="p-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {service.title}
                      </h4>
                      {service.submittedBy && showUserServicesOnly && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full whitespace-nowrap">
                          Your Service
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
