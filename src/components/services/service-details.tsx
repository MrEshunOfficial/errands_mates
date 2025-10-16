// components/services/service-details.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Tag,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Share2,
  Bookmark,
  TrendingUp,
  Phone,
  Mail,
} from "lucide-react";
import { ServiceStatus } from "@/types/base.types";
import type { Service } from "@/types/service.types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserService } from "@/hooks/public/services/use-service";
import { ServiceDetailsSkeleton } from "./service-extras";

interface ServiceDetailsProps {
  serviceId?: string;
  serviceSlug?: string;
  isUserView?: boolean;
  currentUserId?: string; // User ID for ownership checks
  onEdit?: (service: Service) => void;
  onDelete?: (serviceId: string) => void;
}

interface ProviderData {
  _id: string;
  profileId?: {
    _id: string;
    profilePicture?: {
      url?: string;
      fileName?: string;
    };
  };
  providerContactInfo?: {
    businessEmail?: string;
    emergencyContact?: string;
    primaryContact?: string;
    secondaryContact?: string;
  };
  operationalStatus: string;
  serviceOfferings: string[];
  businessName?: string;
}

export default function ServiceDetails({
  serviceId: propsServiceId,
  serviceSlug: propsServiceSlug,
  isUserView = false,
  currentUserId,
  onEdit,
  onDelete,
}: ServiceDetailsProps) {
  const params = useParams();
  const router = useRouter();
  const serviceSlug = propsServiceSlug || (params?.slug as string);
  const serviceId = propsServiceId;

  const {
    currentService,
    isLoading,
    error,
    getServiceBySlug,
    getServiceById,
    getServiceStatusLabel,
    canEditService,
    isServiceOwner,
  } = useUserService();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check if current user owns this service
  const isOwner =
    isUserView &&
    currentUserId &&
    currentService &&
    isServiceOwner(currentService, currentUserId);

  // Check if current user can edit this service
  const canEdit =
    isUserView &&
    currentUserId &&
    currentService &&
    canEditService(currentService, currentUserId);

  useEffect(() => {
    const fetchService = async () => {
      if (serviceId) {
        await getServiceById(serviceId);
      } else if (serviceSlug) {
        await getServiceBySlug(serviceSlug);
      }
    };

    fetchService();
  }, [serviceSlug, serviceId, getServiceBySlug, getServiceById]);

  if (isLoading) {
    return <ServiceDetailsSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-4"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentService) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Service not found. Please check the URL and try again.
        </AlertDescription>
      </Alert>
    );
  }

  const service = currentService;
  const statusLabel = getServiceStatusLabel(service.status);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(service);
    }
  };

  const handleDelete = async () => {
    if (onDelete && service._id) {
      const confirmed = window.confirm(
        "Are you sure you want to delete this service? This action cannot be undone."
      );
      if (confirmed) {
        onDelete(service._id.toString());
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service.title,
          text: service.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement actual bookmark functionality with API
  };

  const providers =
    (currentService.providers as unknown as ProviderData[]) || [];

  // Get status badge variant
  const getStatusBadgeVariant = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.APPROVED:
        return "default";
      case ServiceStatus.REJECTED:
        return "destructive";
      case ServiceStatus.DRAFT:
        return "secondary";
      case ServiceStatus.PENDING_APPROVAL:
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>

        <div className="flex gap-2">
          {!isUserView && (
            <>
              <Button variant="outline" size="icon" onClick={toggleBookmark}>
                <Bookmark
                  size={18}
                  className={isBookmarked ? "fill-current" : ""}
                />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 size={18} />
              </Button>
            </>
          )}

          {isUserView && isOwner && (
            <>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  Edit Service
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* User View Status Alert */}
      {isUserView && service.status !== ServiceStatus.APPROVED && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {service.status === ServiceStatus.DRAFT && (
              <>
                This service is in <strong>draft</strong> mode. Complete and
                submit it for approval to make it visible to customers.
              </>
            )}
            {service.status === ServiceStatus.PENDING_APPROVAL && (
              <>
                This service is <strong>pending approval</strong>. It will be
                reviewed by our team shortly.
              </>
            )}
            {service.status === ServiceStatus.REJECTED && (
              <>
                This service was <strong>rejected</strong>.{" "}
                {service.rejectionReason && (
                  <span>Reason: {service.rejectionReason}</span>
                )}
              </>
            )}
            {service.status === ServiceStatus.SUSPENDED && (
              <>
                This service is <strong>suspended</strong> and not visible to
                customers.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Layout: Providers Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Providers Sidebar - Scrollable list */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Providers List Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users size={20} />
                  Service Providers ({providers.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Scroll to view all available providers
                </p>
              </CardHeader>
              <Separator />
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-3">
                  {providers.length > 0 ? (
                    providers.map((provider) => (
                      <Card
                        key={provider._id.toString()}
                        className="overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          {/* Provider Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage
                                src={provider.profileId?.profilePicture?.url}
                                alt={provider.businessName || "Provider"}
                              />
                              <AvatarFallback className="text-sm font-semibold">
                                {(provider.businessName || "P")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 truncate">
                                {provider.businessName}
                              </h4>
                              <Badge
                                variant={
                                  provider.operationalStatus === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {provider.operationalStatus}
                              </Badge>
                            </div>
                          </div>

                          {/* Services Count */}
                          {provider.serviceOfferings &&
                            provider.serviceOfferings.length > 0 && (
                              <p className="text-xs text-muted-foreground mb-3">
                                Offers {provider.serviceOfferings.length}{" "}
                                service
                                {provider.serviceOfferings.length > 1
                                  ? "s"
                                  : ""}
                              </p>
                            )}

                          <Separator className="my-3" />

                          {/* Quick Contact */}
                          <div className="space-y-2">
                            {provider.providerContactInfo?.emergencyContact && (
                              <a
                                href={`tel:${provider.providerContactInfo.emergencyContact}`}
                                className="flex items-center gap-2 text-xs hover:text-primary transition-colors"
                              >
                                <Phone size={12} className="text-primary" />
                                <span className="truncate">
                                  {
                                    provider.providerContactInfo
                                      .emergencyContact
                                  }
                                </span>
                              </a>
                            )}

                            {provider.providerContactInfo?.businessEmail && (
                              <a
                                href={`mailto:${provider.providerContactInfo.businessEmail}`}
                                className="flex items-center gap-2 text-xs hover:text-primary transition-colors"
                              >
                                <Mail size={12} className="text-primary" />
                                <span className="truncate">
                                  {provider.providerContactInfo.businessEmail}
                                </span>
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users
                        size={32}
                        className="mx-auto text-muted-foreground mb-3"
                      />
                      <p className="text-sm text-muted-foreground">
                        No providers available yet
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>

            {/* Pricing Info - Sticky below providers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign size={18} />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.priceBasedOnServiceType ? (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Pricing varies by service type
                    </p>
                    <p className="text-base font-bold">Based on Your Needs</p>
                  </div>
                ) : service.basePrice ? (
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Starting from
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      GHS {service.basePrice.toLocaleString()}
                    </p>
                  </div>
                ) : service.priceRange ? (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Price Range
                    </p>
                    <p className="text-lg font-bold">
                      {service.priceRange.currency}{" "}
                      {service.priceRange.min.toLocaleString()} -{" "}
                      {service.priceRange.max.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Contact for pricing
                    </p>
                  </div>
                )}

                {service.priceDescription && (
                  <p className="text-xs text-muted-foreground">
                    {service.priceDescription}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Area - Service Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Service Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">
                    {service.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={getStatusBadgeVariant(service.status)}
                      className="gap-1"
                    >
                      {service.status === ServiceStatus.APPROVED ? (
                        <CheckCircle size={14} />
                      ) : service.status === ServiceStatus.REJECTED ? (
                        <XCircle size={14} />
                      ) : (
                        <Clock size={14} />
                      )}
                      {statusLabel}
                    </Badge>

                    {service.isPopular && (
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp size={14} />
                        Popular
                      </Badge>
                    )}

                    {service.category && (
                      <Link
                        href={`/categories/${
                          service.category.slug || service.category._id
                        }`}
                      >
                        <Badge
                          variant="outline"
                          className="gap-1 hover:bg-accent cursor-pointer"
                        >
                          <Tag size={12} />
                          {service.category.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>
                      Listed{" "}
                      {new Date(service.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>
                      Updated{" "}
                      {new Date(service.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Gallery */}
          {service.images && service.images.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Service Gallery</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Carousel
                  className="w-full"
                  opts={{ loop: true }}
                  setApi={(api) => {
                    if (api) {
                      api.on("select", () => {
                        setActiveImageIndex(api.selectedScrollSnap());
                      });
                    }
                  }}
                >
                  <CarouselContent>
                    {service.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative aspect-video w-full bg-muted">
                          <Image
                            src={image.url}
                            alt={`${service.title} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {service.images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {activeImageIndex + 1} / {service.images.length}
                      </div>
                    </>
                  )}
                </Carousel>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {(service.metaDescription ||
            (service.tags && service.tags.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {service.metaDescription && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      About This Service
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.metaDescription}
                    </p>
                  </div>
                )}

                {service.tags && service.tags.length > 0 && (
                  <>
                    {service.metaDescription && <Separator />}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Related Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {service.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="gap-1"
                          >
                            <Tag size={12} />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Service Owner Info - Only for user view */}
          {isUserView && isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Service Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Status
                    </p>
                    <Badge variant={getStatusBadgeVariant(service.status)}>
                      {statusLabel}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Provider Count
                    </p>
                    <p className="font-medium">
                      {service.providerCount || providers.length}
                    </p>
                  </div>
                </div>

                {service.status === ServiceStatus.APPROVED &&
                  service.approvedAt && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Approved on
                        </p>
                        <p className="text-sm">
                          {new Date(service.approvedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </>
                  )}

                {service.status === ServiceStatus.REJECTED &&
                  service.rejectionReason && (
                    <>
                      <Separator />
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="ml-2">
                          <strong>Rejection Reason:</strong>{" "}
                          {service.rejectionReason}
                        </AlertDescription>
                      </Alert>
                      {canEdit && (
                        <p className="text-sm text-muted-foreground">
                          You can edit this service to address the issues and
                          resubmit for approval.
                        </p>
                      )}
                    </>
                  )}

                {service.status === ServiceStatus.DRAFT && (
                  <>
                    <Separator />
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="ml-2">
                        This service is not visible to customers yet. Complete
                        all required information and submit for approval.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
