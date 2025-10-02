import React from "react";
import {
  Phone,
  Mail,
  AlertCircle,
  Building2,
  FileText,
  Calendar,
  Shield,
  MapPin,
  Clock,
  Percent,
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

// Types
interface WorkingHours {
  start: string;
  end: string;
  isAvailable: boolean;
}

interface ProviderContactInfo {
  primaryContact: string;
  secondaryContact?: string;
  businessEmail?: string;
  emergencyContact?: string;
}

interface SafetyMeasures {
  requiresDeposit: boolean;
  depositAmount?: number;
  hasInsurance: boolean;
  insuranceProvider?: string;
  insuranceExpiryDate?: string | Date;
  emergencyContactVerified: boolean;
}

interface BusinessRegistration {
  registrationNumber: string;
  registrationDocument: {
    url: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt?: string | Date;
  };
}

interface Insurance {
  provider: string;
  policyNumber: string;
  expiryDate: string | Date;
  document: {
    url: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt?: string | Date;
  };
}

interface FormData {
  providerContactInfo?: ProviderContactInfo;
  operationalStatus?: string;
  workingHours?: Record<string, WorkingHours>;
  isAvailableForWork?: boolean;
  isAlwaysAvailable?: boolean;
  businessName?: string;
  businessRegistration?: BusinessRegistration;
  insurance?: Insurance;
  safetyMeasures?: SafetyMeasures;
  riskLevel?: string;
  lastRiskAssessmentDate?: string | Date;
  penaltiesCount?: number;
  lastPenaltyDate?: string | Date;
}

interface StepProps {
  formData: FormData;
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
      {/* Primary Contact */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Primary Contact *
        </Label>
        <Input
          type="tel"
          value={formData.providerContactInfo?.primaryContact || ""}
          onChange={(e) =>
            handleInputChange(
              "providerContactInfo.primaryContact",
              e.target.value
            )
          }
          placeholder="+233 XX XXX XXXX"
        />
        {validationErrors["providerContactInfo.primaryContact"] && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationErrors["providerContactInfo.primaryContact"][0]}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Secondary Contact */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Secondary Contact
        </Label>
        <Input
          type="tel"
          value={formData.providerContactInfo?.secondaryContact || ""}
          onChange={(e) =>
            handleInputChange(
              "providerContactInfo.secondaryContact",
              e.target.value
            )
          }
          placeholder="+233 XX XXX XXXX (Optional)"
        />
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

      {/* Emergency Contact */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-red-500" />
          Emergency Contact
        </Label>
        <Input
          type="tel"
          value={formData.providerContactInfo?.emergencyContact || ""}
          onChange={(e) =>
            handleInputChange(
              "providerContactInfo.emergencyContact",
              e.target.value
            )
          }
          placeholder="+233 XX XXX XXXX"
        />
        <p className="text-sm text-muted-foreground">
          Contact person in case of emergency
        </p>
      </div>

      {/* Availability Toggles */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Available for Work</Label>
              <p className="text-sm text-muted-foreground">
                Indicate whether you are currently available for work
              </p>
            </div>
            <Switch
              checked={formData.isAvailableForWork ?? true}
              onCheckedChange={(checked) =>
                handleInputChange("isAvailableForWork", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Always Available</Label>
              <p className="text-sm text-muted-foreground">
                Let clients know whether you operate 24/7
              </p>
            </div>
            <Switch
              checked={formData.isAlwaysAvailable ?? false}
              onCheckedChange={(checked) =>
                handleInputChange("isAlwaysAvailable", checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Location Step Component
export const LocationStep: React.FC<StepProps> = ({
  formData,
  updateFieldValue,
  clearFieldError,
}) => {
  const handleInputChange = (field: string, value: string | WorkingHours) => {
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
    const dayHours = currentHours[day] || {
      start: "09:00",
      end: "17:00",
      isAvailable: false,
    };

    handleInputChange(`workingHours.${day}`, {
      ...dayHours,
      isAvailable: !dayHours.isAvailable,
    });
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
      isAvailable: true,
    };

    handleInputChange(`workingHours.${day}`, {
      ...dayHours,
      [timeType]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Service Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Service Area
          </CardTitle>
          <CardDescription>
            Define the geographical areas where you provide services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Primary Service Location</Label>
            <Input placeholder="e.g., Accra, Greater Accra Region" />
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {daysOfWeek.map((day) => {
            const dayHours = formData.workingHours?.[day] || {
              start: "09:00",
              end: "17:00",
              isAvailable: false,
            };

            return (
              <Card
                key={day}
                className={dayHours.isAvailable ? "border-green-500" : ""}
              >
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={dayHours.isAvailable}
                          onCheckedChange={() => toggleDayAvailability(day)}
                        />
                        <Label className="capitalize">{day}</Label>
                      </div>
                      {!dayHours.isAvailable && (
                        <span className="text-sm text-muted-foreground">
                          Unavailable
                        </span>
                      )}
                    </div>

                    {dayHours.isAvailable && (
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
      {/* Safety Measures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Safety Measures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require a Deposit?</Label>
              <p className="text-sm text-muted-foreground">
                Ask customers for a partial payment before starting work.
              </p>
            </div>
            <Switch
              checked={formData.safetyMeasures?.requiresDeposit ?? false}
              onCheckedChange={(checked) =>
                handleInputChange("safetyMeasures.requiresDeposit", checked)
              }
            />
          </div>

          {formData.safetyMeasures?.requiresDeposit && (
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
                value={formData.safetyMeasures?.depositAmount || ""}
                onChange={(e) =>
                  handleInputChange(
                    "safetyMeasures.depositAmount",
                    parseFloat(e.target.value)
                  )
                }
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Insurance Coverage</Label>
              <p className="text-sm text-muted-foreground">
                Show customers that your business is backed by credible
                insurance.
              </p>
            </div>

            <Switch
              checked={formData.safetyMeasures?.hasInsurance ?? false}
              onCheckedChange={(checked) =>
                handleInputChange("safetyMeasures.hasInsurance", checked)
              }
            />
          </div>

          {formData.safetyMeasures?.hasInsurance && (
            <div className="space-y-3 pl-4 border-l-2">
              <div className="space-y-2">
                <Label>Insurance Provider</Label>
                <Input
                  value={formData.safetyMeasures?.insuranceProvider || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "safetyMeasures.insuranceProvider",
                      e.target.value
                    )
                  }
                  placeholder="e.g., Enterprise Insurance"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Insurance Expiry Date
                </Label>
                <Input
                  type="date"
                  value={
                    formData.safetyMeasures?.insuranceExpiryDate
                      ? new Date(formData.safetyMeasures.insuranceExpiryDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "safetyMeasures.insuranceExpiryDate",
                      e.target.value
                    )
                  }
                />
              </div>
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
              {formData.safetyMeasures?.requiresDeposit
                ? `GHS ${formData.safetyMeasures.depositAmount || 0}`
                : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Insurance:</span>
            <span className="font-medium">
              {formData.safetyMeasures?.hasInsurance
                ? "✓ Covered"
                : "✗ Not Covered"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Business Details Step Component
export const BusinessDetailsStep: React.FC<StepProps> = ({
  formData,
  updateFieldValue,
  clearFieldError,
}) => {
  const handleInputChange = (field: string, value: string) => {
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
      </div>

      {/* Business Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Business Registration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Registration Number</Label>
            <Input
              value={formData.businessRegistration?.registrationNumber || ""}
              onChange={(e) =>
                handleInputChange(
                  "businessRegistration.registrationNumber",
                  e.target.value
                )
              }
              placeholder="e.g., BN123456789"
            />
          </div>

          <div className="space-y-2">
            <Label>Registration Document Link</Label>
            <Input
              type="url"
              value={
                formData.businessRegistration?.registrationDocument?.url || ""
              }
              onChange={(e) =>
                handleInputChange(
                  "businessRegistration.registrationDocument.url",
                  e.target.value
                )
              }
              placeholder="https://example.com/document.pdf"
            />
          </div>

          <div className="space-y-2">
            <Label>Document File Name</Label>
            <Input
              value={
                formData.businessRegistration?.registrationDocument?.fileName ||
                ""
              }
              onChange={(e) =>
                handleInputChange(
                  "businessRegistration.registrationDocument.fileName",
                  e.target.value
                )
              }
              placeholder="registration_certificate.pdf"
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Insurance Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Insurance Provider</Label>
            <Input
              value={formData.insurance?.provider || ""}
              onChange={(e) =>
                handleInputChange("insurance.provider", e.target.value)
              }
              placeholder="e.g., Enterprise Insurance"
            />
          </div>

          <div className="space-y-2">
            <Label>Policy Number</Label>
            <Input
              value={formData.insurance?.policyNumber || ""}
              onChange={(e) =>
                handleInputChange("insurance.policyNumber", e.target.value)
              }
              placeholder="POL-123456789"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Expiry Date
            </Label>
            <Input
              type="date"
              value={
                formData.insurance?.expiryDate
                  ? new Date(formData.insurance.expiryDate)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) =>
                handleInputChange("insurance.expiryDate", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Insurance Document Link</Label>
            <Input
              type="url"
              value={formData.insurance?.document?.url || ""}
              onChange={(e) =>
                handleInputChange("insurance.document.url", e.target.value)
              }
              placeholder="https://example.com/insurance.pdf"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ServicesOfferedStep: React.FC<StepProps> = () => {
  return (
    <div>
      {/* Your step content here */}
      <h2 className="text-xl font-semibold">Services Offered</h2>
      <p className="text-sm text-muted-foreground">
        Select the services your business provides.
      </p>
      {/* Example: render children or form fields */}
    </div>
  );
};
