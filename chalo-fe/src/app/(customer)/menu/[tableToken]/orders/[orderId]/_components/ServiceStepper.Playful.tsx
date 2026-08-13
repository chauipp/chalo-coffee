"use client";

import { ServiceStepperCinematic } from "./ServiceStepper.Cinematic";

type ServiceStepperProps = Parameters<typeof ServiceStepperCinematic>[0];

export const ServiceStepperPlayful = (props: ServiceStepperProps) => <ServiceStepperCinematic {...props} />;
