import { Request, Response } from "express";
import {
  getParentProfile,
  updateParentProfile,
} from "../services/parent.service";
import {
  upsertAddressByUserId,
  getAddressByUserId,
} from "../services/address.service";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/messages";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
      });
    }

    const profile = await getParentProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.PARENT_PROFILE_NOT_FOUND,
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching parent profile:", error);
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_FETCH_PARENT_PROFILE,
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.NO_UPDATES_PROVIDED,
      });
    }

    const updated = await updateParentProfile(userId, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.PARENT_PROFILE_NOT_FOUND_OR_NO_CHANGES,
      });
    }

    const updatedProfile = await getParentProfile(userId);

    return res.status(200).json({
      success: true,
      data: updatedProfile,
      message: SUCCESS_MESSAGES.PROFILE_UPDATED_SUCCESSFULLY,
    });
  } catch (error) {
    console.error("Error updating parent profile:", error);
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_UPDATE_PARENT_PROFILE,
    });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { street, city, state, zipCode, coordinates } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
      });
    }

    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.ADDRESS_FIELDS_REQUIRED,
      });
    }

    const addressData: any = {
      street,
      city,
      state,
      zipCode,
    };

    if (coordinates && coordinates.lat && coordinates.lng) {
      addressData.coordinates = {
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
    }

    const updated = await upsertAddressByUserId(userId, addressData);

    if (!updated) {
      return res.status(500).json({
        success: false,
        error: ERROR_MESSAGES.FAILED_TO_UPDATE_ADDRESS,
      });
    }

    const updatedAddress = await getAddressByUserId(userId);

    return res.status(200).json({
      success: true,
      data: updatedAddress,
      message: SUCCESS_MESSAGES.ADDRESS_UPDATED_SUCCESSFULLY,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_UPDATE_ADDRESS,
    });
  }
};

export const getAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.USER_NOT_AUTHENTICATED,
      });
    }

    const address = await getAddressByUserId(userId);

    if (!address) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.ADDRESS_NOT_FOUND,
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("Error fetching address:", error);
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.FAILED_TO_FETCH_ADDRESS,
    });
  }
};
