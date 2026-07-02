import { Schedule, StudentProfile, CurriculumNode, TeacherLesson, TeacherSchedule } from '../types';

const PROFILE_KEY = 'madrasati_student_profile_v2';
const SCHEDULES_KEY = 'madrasati_schedules_v2';
const ACTIVE_ID_KEY = 'madrasati_active_schedule_id_v2';

const USER_ROLE_KEY = 'madrasati_user_role_v2';
const CURRICULUM_TREE_KEY = 'madrasati_curriculum_tree_v2';
const TEACHER_LESSONS_KEY = 'madrasati_teacher_lessons_v2';
const TEACHER_SCHEDULES_KEY = 'madrasati_teacher_schedules_v2';
const ACTIVE_TEACHER_SCHEDULE_ID_KEY = 'madrasati_active_teacher_schedule_id_v2';

export const getStudentProfile = (): StudentProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as StudentProfile;
  } catch {
    return null;
  }
};

export const saveStudentProfile = (profile: StudentProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const clearStudentProfile = () => {
  localStorage.removeItem(PROFILE_KEY);
};

export const getSavedSchedules = (): Schedule[] => {
  const data = localStorage.getItem(SCHEDULES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as Schedule[];
  } catch {
    return [];
  }
};

export const saveSchedules = (schedules: Schedule[]) => {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
};

export const getActiveScheduleId = (): string => {
  return localStorage.getItem(ACTIVE_ID_KEY) || '';
};

export const saveActiveScheduleId = (id: string) => {
  localStorage.setItem(ACTIVE_ID_KEY, id);
};

// --- NEW PERSISTENCE HELPERS FOR TEACHER MODE & CURRICULUM TREE ---

export const getUserRole = (): 'student' | 'teacher' => {
  return (localStorage.getItem(USER_ROLE_KEY) as 'student' | 'teacher') || 'student';
};

export const saveUserRole = (role: 'student' | 'teacher') => {
  localStorage.setItem(USER_ROLE_KEY, role);
};

export const getCurriculumTree = (): CurriculumNode[] => {
  const data = localStorage.getItem(CURRICULUM_TREE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as CurriculumNode[];
  } catch {
    return [];
  }
};

export const saveCurriculumTree = (tree: CurriculumNode[]) => {
  localStorage.setItem(CURRICULUM_TREE_KEY, JSON.stringify(tree));
};

export const getTeacherLessons = (): TeacherLesson[] => {
  const data = localStorage.getItem(TEACHER_LESSONS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as TeacherLesson[];
  } catch {
    return [];
  }
};

export const saveTeacherLessons = (lessons: TeacherLesson[]) => {
  localStorage.setItem(TEACHER_LESSONS_KEY, JSON.stringify(lessons));
};

export const getTeacherSchedules = (): TeacherSchedule[] => {
  const data = localStorage.getItem(TEACHER_SCHEDULES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as TeacherSchedule[];
  } catch {
    return [];
  }
};

export const saveTeacherSchedules = (schedules: TeacherSchedule[]) => {
  localStorage.setItem(TEACHER_SCHEDULES_KEY, JSON.stringify(schedules));
};

export const getActiveTeacherScheduleId = (): string => {
  return localStorage.getItem(ACTIVE_TEACHER_SCHEDULE_ID_KEY) || '';
};

export const saveActiveTeacherScheduleId = (id: string) => {
  localStorage.setItem(ACTIVE_TEACHER_SCHEDULE_ID_KEY, id);
};

