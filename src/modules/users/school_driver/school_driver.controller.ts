import { Request, Response } from "express";

import { userRepository } from "@modules/auth/auth.repository";
import { schoolSubscriptionRepository } from "@modules/billing/school_subscription/school_subscription.repository";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  SUCCESS_MESSAGES_COMMON,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import { driverRepository } from "../driver/driver.repository";

/**
 * Get all drivers for a school (school admin only)
 * @route GET /api/v1/drivers/school/:schoolId
 */
export const getSchoolDrivers = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    if (!schoolId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_DRIVER.SCHOOL_ID_REQUIRED,
      );
    }

    const drivers = await driverRepository.findMany({
      school_id: schoolId,
    });

    return res.json({
      success: true,
      data: drivers,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

/**
 * Assign driver to school (school admin only)
 * @route POST /api/v1/drivers/school/assign
 */
export const assignDriverToSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId, schoolId } = req.body;
    if (!driverId || !schoolId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_DRIVER.DRIVER_ID_AND_SCHOOL_ID_REQUIRED,
      );
    }

    const user = await userRepository.findById(driverId);

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_DRIVER.DRIVER_NOT_FOUND,
      );
    }

    const driver = await driverRepository.findByUserId(user._id.toString());

    if (!driver) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_DRIVER.DRIVER_NOT_FOUND,
      );
    }

    // Check if school has active subscription capacity for drivers
    // const subscription =
    //   await schoolSubscriptionRepository.findActiveBySchoolId(schoolId);

    // if (subscription && subscription.max_drivers) {
    //   const existingDrivers = await driverRepository.findMany({
    //     school_id: schoolId,
    //     is_active: true,
    //   });

    //   if (existingDrivers.length >= subscription.max_drivers) {
    //     throw new ApiError(
    //       HTTP_STATUS.BAD_REQUEST,
    //       `${ERROR_MESSAGES.SCHOOL_DRIVER.CAPACITY_REACHED.replace("{capacity}", subscription.max_drivers.toString())}`,
    //     );
    //   }
    // }

    // Assign driver to school
    const updatedDriver = await driverRepository.updateById(
      driver._id.toString(),
      {
        $set: {
          school_id: schoolId,
          updated_at: new Date(),
        },
      },
    );

    return res.json({
      success: true,
      data: updatedDriver,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

/**
 * Remove driver from school (school admin only)
 * @route POST /api/v1/drivers/school/:driverId/remove
 */
export const removeDriverFromSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;

    if (!driverId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_DRIVER.DRIVER_ID_REQUIRED,
      );
    }

    const user = await userRepository.findById(driverId);

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_DRIVER.DRIVER_NOT_FOUND,
      );
    }

    const driver = await driverRepository.findByUserId(user._id.toString());

    if (!driver) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_DRIVER.DRIVER_NOT_FOUND,
      );
    }

    // Remove driver from school
    const updatedDriver = await driverRepository.updateById(
      driver._id.toString(),
      {
        $set: {
          school_id: undefined,
          updated_at: new Date(),
        },
      },
    );

    return res.json({
      success: true,
      data: updatedDriver,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

/**
 * Get driver details by school admin
 * @route GET /api/v1/drivers/school/:driverId/details
 */
export const getSchoolDriverDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;

    if (!driverId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_DRIVER.DRIVER_ID_REQUIRED,
      );
    }

    const driver = await driverRepository.findById(driverId);

    if (!driver) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_DRIVER.DRIVER_NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: driver,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);
