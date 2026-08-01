import { prisma } from '../../lib/prisma.js';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../types/appError.js';

export const createProject = async (
  //creates a new project and assigns the creating user as a 'PROJECT_ADMIN' member.
  // requires user authentication.

  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user.userId) {
      return next(new AppError('Missing user authentication', 401));
    }
    const userId = req.user.userId;
    const { projectname, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name: projectname,
        description,
        createdBy: { connect: { id: userId } },
      },
    });

    // Assign the creating user as a PROJECT_ADMIN for the new project
    await prisma.projectMembership.create({
      data: {
        userId,
        projectId: project.id,
        role: 'PROJECT_ADMIN',
      },
    });

    return res
      .status(201)
      .json({ message: 'Project created successfully', project });
  } catch (err) {
    next(err);
  }
};

export const updateProject =
  //Updates an existing project's name and description.
  //Requires the project to exist and not be archived.
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { description, projectname } = req.body;

      // Find the project, ensuring it's not archived
      const project = await prisma.project.findUnique({
        where: { id: projectId, archived: false },
      });
      if (!projectname) {
        return next(new AppError('name cannot be null', 400));
      }
      if (!project) {
        return next(new AppError('project not found', 404));
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { name: projectname, description },
      });
      res.status(200).json(updatedProject);
    } catch (err) {
      next(err);
    }
  };

export const getProjects = async (
  //Retrieves projects associated with the authenticated user.
  //Can fetch a specific project by ID or all projects the user is a member of.
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId;
    if (!req.user || !req.user.userId) {
      return next(new AppError('Missing user authentication', 401));
    }
    const userId = req.user.userId;

    let memberships;
    if (!projectId) {
      // If no specific projectId is provided, fetch all memberships for the user
      // fetches archived and non archived together
      memberships = await prisma.projectMembership.findMany({
        where: { userId },
        include: { project: true },
      });
    } else {
      // If a projectId is provided, fetch the specific membership
      memberships = await prisma.projectMembership.findMany({
        where: {
          userId,
          projectId: Number(projectId),
        },
        include: { project: true },
      });
    }
    // Map memberships to project details, including the user's role in each project
    const projects = memberships.map((membership) => ({
      ...membership.project,
      userRole: membership.role,
    }));
    return res.status(200).json({ projects });
  } catch (err) {
    next(err);
  }
};

export const projectArchive =
  //archives the project
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId;
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
      });

      if (!project) {
        return next(new AppError('project not found', 404));
      }

      if (project.createdById !== req.user?.userId) {
        return next(
          new AppError('Only the project creator can archive this project', 403),
        );
      }

      if (project?.archived === true) {
        return next(new AppError('Project already archived', 409));
      }

      await prisma.project.update({
        where: { id: parseInt(projectId) },
        data: { archived: true, archivedAt: new Date() },
      });

      return res.status(201).json({ message: 'Archived successfully' });
    } catch (err) {
      next(err);
    }
  };

export const unarchiveProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //unarchives the project
  try {
    const projectId = req.params.projectId;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      return next(new AppError('project not found', 404));
    }

    if (project.createdById !== req.user?.userId) {
      return next(
        new AppError('Only the project creator can unarchive this project', 403),
      );
    }

    if (!project.archived) {
      return next(new AppError('Project is not archived', 400));
    }

    await prisma.project.update({
      where: { id: parseInt(projectId) },
      data: { archived: false, archivedAt: null },
    });

    return res.status(200).json({ message: 'Unarchived successfully' });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    if (project.createdById !== req.user?.userId) {
      return next(
        new AppError('Only the project creator can delete this project', 403),
      );
    }

    await prisma.project.delete({
      where: { id: parseInt(projectId) },
    });

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};
