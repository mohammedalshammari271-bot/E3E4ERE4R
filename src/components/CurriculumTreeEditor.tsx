import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Folder, FileText, Bookmark, Plus, Edit2, Trash2, ChevronDown, 
  ChevronLeft, ArrowUp, ArrowDown, CheckSquare, Square, Save, RotateCcw,
  Calendar, Check, AlertCircle, Trash, X, Copy, Move, RefreshCw
} from 'lucide-react';
import { CurriculumNode, Schedule } from '../types';
import { CURRICULUM_TREES } from '../constants/subjects';
import { getCurriculumTree, saveCurriculumTree } from '../utils/db';

interface CurriculumTreeEditorProps {
  activeSchedule: Schedule | null;
  onUpdateSchedule: (fields: Partial<Schedule>) => void;
  gradeClass: string;
}

export const CurriculumTreeEditor: React.FC<CurriculumTreeEditorProps> = ({
  activeSchedule,
  onUpdateSchedule,
  gradeClass
}) => {
  const [tree, setTree] = useState<CurriculumNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  
  // Undo deletion backup
  const [deleteBackup, setDeleteBackup] = useState<{
    tree: CurriculumNode[];
    deletedNode: CurriculumNode;
  } | null>(null);

  // Link to schedule state
  const [linkingNode, setLinkingNode] = useState<CurriculumNode | null>(null);
  const [linkDayIdx, setLinkDayIdx] = useState<number>(0);
  const [linkLessonIdx, setLinkLessonIdx] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState('');

  // Move lesson state
  const [movingLessonId, setMovingLessonId] = useState<string | null>(null);
  const [moveTargetChapterId, setMoveTargetChapterId] = useState<string>('');

  // Is this a ministerial grade?
  const isTerminalGrade = ['السادس العلمي', 'السادس الأدبي', 'الثالث المتوسط', 'السادس الابتدائي'].includes(gradeClass);

  // Initialize tree
  useEffect(() => {
    const savedTree = getCurriculumTree();
    if (savedTree && savedTree.length > 0) {
      // Migrate existing nodes if they don't have the new tracking properties
      const migrated = savedTree.map((sub: any) => ({
        ...sub,
        children: sub.children?.map((chap: any) => ({
          ...chap,
          children: chap.children?.map((less: any) => ({
            reviewCount: less.reviewCount !== undefined ? less.reviewCount : 0,
            questionsCount: less.questionsCount !== undefined ? less.questionsCount : 15,
            ministerialQuestionsCount: less.ministerialQuestionsCount !== undefined ? less.ministerialQuestionsCount : 8,
            masteryPercentage: less.masteryPercentage !== undefined ? less.masteryPercentage : 0,
            lastReviewDate: less.lastReviewDate !== undefined ? less.lastReviewDate : '—',
            ...less
          }))
        }))
      }));
      setTree(migrated);
    } else {
      // Prepopulate from CURRICULUM_TREES for this grade
      const presets = CURRICULUM_TREES[gradeClass] || [];
      if (presets.length > 0) {
        const initialTree: CurriculumNode[] = presets.map((sub, sIdx) => ({
          id: `sub-${sIdx}-${Date.now()}`,
          name: sub.subjectName,
          type: 'subject',
          children: sub.chapters.map((chap, cIdx) => ({
            id: `chap-${sIdx}-${cIdx}-${Date.now()}`,
            name: chap.name,
            type: 'chapter',
            children: chap.lessons.map((less, lIdx) => ({
              id: `less-${sIdx}-${cIdx}-${lIdx}-${Date.now()}`,
              name: less,
              type: 'lesson',
              completed: false,
              reviewCount: Math.floor(Math.random() * 3),
              lastReviewDate: Math.random() > 0.4 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '—',
              questionsCount: 10 + Math.floor(Math.random() * 20),
              ministerialQuestionsCount: 5 + Math.floor(Math.random() * 12),
              masteryPercentage: Math.floor(Math.random() * 100)
            }))
          }))
        }));
        setTree(initialTree);
        saveCurriculumTree(initialTree);
      } else {
        setTree([]);
      }
    }
  }, [gradeClass]);

  // Sync to localstorage helper
  const updateTreeState = (newTree: CurriculumNode[]) => {
    setTree(newTree);
    saveCurriculumTree(newTree);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Expand / collapse toggle
  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to find and mutate a node in the tree
  const findAndMutateNode = (
    nodes: CurriculumNode[], 
    targetId: string, 
    mutation: (node: CurriculumNode) => void
  ): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === targetId) {
        mutation(nodes[i]);
        return true;
      }
      if (nodes[i].children) {
        const found = findAndMutateNode(nodes[i].children!, targetId, mutation);
        if (found) return true;
      }
    }
    return false;
  };

  // Helper to find parent of a node to remove it or insert children
  const findParentAndRemove = (
    nodes: CurriculumNode[],
    targetId: string
  ): { success: boolean; parentChildren?: CurriculumNode[]; removedNode?: CurriculumNode } => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === targetId) {
        const removed = nodes.splice(i, 1)[0];
        return { success: true, removedNode: removed };
      }
      if (nodes[i].children) {
        const idx = nodes[i].children!.findIndex(c => c.id === targetId);
        if (idx !== -1) {
          const removed = nodes[i].children!.splice(idx, 1)[0];
          return { success: true, parentChildren: nodes[i].children, removedNode: removed };
        }
        const res = findParentAndRemove(nodes[i].children!, targetId);
        if (res.success) return res;
      }
    }
    return { success: false };
  };

  // 1. ADD NODE
  const handleAddNode = (parentId: string | null, type: CurriculumNode['type']) => {
    const labelMap: Record<CurriculumNode['type'], string> = {
      subject: 'مادة جديدة',
      unit: 'وحدة جديدة',
      chapter: 'فصل جديد',
      lesson: 'درس جديد',
      subpart: 'ملاحظة مخصصة'
    };

    const newNode: CurriculumNode = {
      id: `${type}-${Date.now()}`,
      name: `${labelMap[type]}`,
      type,
      children: type !== 'lesson' && type !== 'subpart' ? [] : undefined,
      completed: false,
      reviewCount: type === 'lesson' ? 0 : undefined,
      lastReviewDate: type === 'lesson' ? '—' : undefined,
      questionsCount: type === 'lesson' ? 10 : undefined,
      ministerialQuestionsCount: type === 'lesson' ? 5 : undefined,
      masteryPercentage: type === 'lesson' ? 0 : undefined
    };

    if (parentId === null) {
      const newTree = [...tree, newNode];
      updateTreeState(newTree);
      showToast('تم إضافة مادة دراسية جديدة');
    } else {
      const newTree = JSON.parse(JSON.stringify(tree));
      findAndMutateNode(newTree, parentId, (node) => {
        if (!node.children) node.children = [];
        node.children.push(newNode);
      });
      updateTreeState(newTree);
      setExpandedNodes(prev => ({ ...prev, [parentId]: true }));
      showToast('تم إضافة عنصر جديد بنجاح');
    }
  };

  // 2. START EDIT NODE NAME
  const startEdit = (node: CurriculumNode) => {
    setEditingNodeId(node.id);
    setEditingName(node.name);
  };

  // 3. SAVE NODE NAME
  const saveNodeName = () => {
    if (!editingNodeId || !editingName.trim()) return;
    const newTree = JSON.parse(JSON.stringify(tree));
    findAndMutateNode(newTree, editingNodeId, (node) => {
      node.name = editingName.trim();
    });
    updateTreeState(newTree);
    setEditingNodeId(null);
    showToast('تم تحديث الاسم بنجاح');
  };

  // 4. DELETE NODE WITH CONFIRMATION AND UNDO
  const deleteNode = (node: CurriculumNode) => {
    let warningMsg = `هل أنت متأكد من حذف "${node.name}"؟`;
    if (node.children && node.children.length > 0) {
      warningMsg = `تحذير: هذا العنصر يحتوي على (${node.children.length}) عناصر فرعية. حذف هذا العنصر سيؤدي إلى حذف كافة الأجزاء التابعة له نهائياً. هل تؤكد الحذف؟`;
    }

    const confirmDelete = window.confirm(warningMsg);
    if (!confirmDelete) return;

    const treeBackup = JSON.parse(JSON.stringify(tree));
    const newTree = JSON.parse(JSON.stringify(tree));

    const res = findParentAndRemove(newTree, node.id);
    if (res.success) {
      updateTreeState(newTree);
      setDeleteBackup({
        tree: treeBackup,
        deletedNode: res.removedNode!
      });
      if (selectedLessonId === node.id) {
        setSelectedLessonId(null);
      }
      showToast(`تم حذف "${node.name}" بنجاح. يمكنك التراجع عن الإجراء.`);
    }
  };

  // Undo delete
  const undoDelete = () => {
    if (!deleteBackup) return;
    updateTreeState(deleteBackup.tree);
    setDeleteBackup(null);
    showToast('تم استعادة العنصر المحذوف بنجاح!');
  };

  // 5. MOVE NODE (REORDER UP / DOWN)
  const moveNode = (nodeId: string, direction: 'up' | 'down') => {
    const newTree = JSON.parse(JSON.stringify(tree));
    
    const findAndMove = (nodes: CurriculumNode[]): boolean => {
      const idx = nodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) {
        if (direction === 'up' && idx > 0) {
          const temp = nodes[idx];
          nodes[idx] = nodes[idx - 1];
          nodes[idx - 1] = temp;
          return true;
        }
        if (direction === 'down' && idx < nodes.length - 1) {
          const temp = nodes[idx];
          nodes[idx] = nodes[idx + 1];
          nodes[idx + 1] = temp;
          return true;
        }
        return false;
      }
      
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].children) {
          const done = findAndMove(nodes[i].children!);
          if (done) return true;
        }
      }
      return false;
    };

    if (findAndMove(newTree)) {
      updateTreeState(newTree);
      showToast('تم إعادة ترتيب العناصر بنجاح');
    }
  };

  // 6. TOGGLE COMPLETION
  const toggleCompletion = (nodeId: string) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    findAndMutateNode(newTree, nodeId, (node) => {
      node.completed = !node.completed;
      const cascade = (n: CurriculumNode, val: boolean) => {
        n.completed = val;
        if (n.children) {
          n.children.forEach(c => cascade(c, val));
        }
      };
      cascade(node, node.completed || false);
    });
    updateTreeState(newTree);
  };

  // 7. DUPLICATE LESSON (نسخ الدرس)
  const duplicateLesson = (lesson: CurriculumNode) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    
    const findAndDuplicate = (nodes: CurriculumNode[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].children) {
          const idx = nodes[i].children!.findIndex(c => c.id === lesson.id);
          if (idx !== -1) {
            const original = nodes[i].children![idx];
            const duplicate: CurriculumNode = {
              ...original,
              id: `less-dup-${Date.now()}`,
              name: `${original.name} (نسخة)`,
              completed: false,
              masteryPercentage: 0
            };
            nodes[i].children!.splice(idx + 1, 0, duplicate);
            return true;
          }
          if (findAndDuplicate(nodes[i].children!)) return true;
        }
      }
      return false;
    };

    if (findAndDuplicate(newTree)) {
      updateTreeState(newTree);
      showToast(`تم نسخ وتكرار الدرس "${lesson.name}" بنجاح!`);
    }
  };

  // 8. GET ALL CHAPTERS FOR MOVE SELECT
  const getAllChapters = (nodes: CurriculumNode[]): { id: string; name: string; subjectName: string }[] => {
    const chapters: { id: string; name: string; subjectName: string }[] = [];
    nodes.forEach(sub => {
      if (sub.type === 'subject' && sub.children) {
        sub.children.forEach(chap => {
          if (chap.type === 'chapter') {
            chapters.push({
              id: chap.id,
              name: chap.name,
              subjectName: sub.name
            });
          }
        });
      }
    });
    return chapters;
  };

  // 9. MOVE LESSON TO TARGET CHAPTER
  const handleMoveLesson = () => {
    if (!movingLessonId || !moveTargetChapterId) return;

    const newTree = JSON.parse(JSON.stringify(tree));
    let lessonNode: CurriculumNode | null = null;

    // Find and remove lesson
    const findAndRemove = (nodes: CurriculumNode[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].children) {
          const idx = nodes[i].children!.findIndex(c => c.id === movingLessonId);
          if (idx !== -1) {
            lessonNode = nodes[i].children!.splice(idx, 1)[0];
            return true;
          }
          if (findAndRemove(nodes[i].children!)) return true;
        }
      }
      return false;
    };

    findAndRemove(newTree);

    if (!lessonNode) {
      showToast('خطأ: لم يتم العثور على الدرس.');
      setMovingLessonId(null);
      return;
    }

    // Add to target chapter
    const findAndAdd = (nodes: CurriculumNode[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === moveTargetChapterId) {
          if (!nodes[i].children) nodes[i].children = [];
          nodes[i].children!.push(lessonNode!);
          return true;
        }
        if (nodes[i].children) {
          if (findAndAdd(nodes[i].children!)) return true;
        }
      }
      return false;
    };

    if (findAndAdd(newTree)) {
      updateTreeState(newTree);
      setExpandedNodes(prev => ({ ...prev, [moveTargetChapterId]: true }));
      setMovingLessonId(null);
      showToast(`تم نقل الدرس بنجاح إلى الفصل المختار!`);
    } else {
      showToast('حدث خطأ أثناء النقل.');
    }
  };

  // 10. UPDATE LESSON DETAIL PROPERTY INDIVIDUALLY
  const updateLessonProperty = (lessonId: string, property: string, value: any) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    findAndMutateNode(newTree, lessonId, (node: any) => {
      node[property] = value;
    });
    updateTreeState(newTree);
  };

  // 11. ADD LESSON TO ACTIVE SCHEDULE CELL
  const handleLinkToSchedule = () => {
    if (!activeSchedule || !linkingNode) return;

    const cellKey = `${linkDayIdx}-${linkLessonIdx}`;
    const targetCell = activeSchedule.cells[cellKey] || {
      subject: '',
      type: 'study',
      status: 'upcoming',
      color: '#E9E6FA'
    };

    let nodeSubjectName = '';
    const findSubjectName = (nodes: CurriculumNode[], targetId: string, currentSub: string): string => {
      for (const n of nodes) {
        let sub = currentSub;
        if (n.type === 'subject') sub = n.name;
        if (n.id === targetId) return sub;
        if (n.children) {
          const s = findSubjectName(n.children, targetId, sub);
          if (s) return s;
        }
      }
      return '';
    };

    nodeSubjectName = findSubjectName(tree, linkingNode.id, '') || activeSchedule.gradeClass;

    const updatedCells = {
      ...activeSchedule.cells,
      [cellKey]: {
        ...targetCell,
        subject: nodeSubjectName,
        topic: linkingNode.name,
        notes: `درس مستورد ومجدول من شجرة المنهج الوزاري: ${linkingNode.name}`
      }
    };

    onUpdateSchedule({ cells: updatedCells });
    setLinkingNode(null);
    showToast(`تم ربط الدرس وبدء جدولته بنجاح يوم ${activeSchedule.days[linkDayIdx]}!`);
  };

  // Find a lesson node by id helper
  const findLessonNode = (nodes: CurriculumNode[], id: string): CurriculumNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findLessonNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedLessonNode = selectedLessonId ? findLessonNode(tree, selectedLessonId) : null;

  // Render tree with explicit text connectors (├─, │, └─) for strict adherence
  const renderTreeLayout = () => {
    return (
      <div className="space-y-4 pr-1">
        {tree.map((subjectNode) => {
          const isSubExpanded = !!expandedNodes[subjectNode.id];
          return (
            <div key={subjectNode.id} className="bg-white rounded-2xl border border-[#D9D3F0] p-4 shadow-sm space-y-3">
              {/* SUBJECT LEVEL HEADER */}
              <div className="flex items-center justify-between border-b border-[#D9D3F0]/60 pb-3">
                <div 
                  onClick={() => toggleExpand(subjectNode.id)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1"
                >
                  <BookOpen className="w-5 h-5 text-[#5B2596]" />
                  <span className="font-extrabold text-sm sm:text-base text-[#3E176D]">{subjectNode.name}</span>
                  <span className="text-[10px] bg-purple-100 text-[#5B2596] font-bold px-2 py-0.5 rounded-full">
                    {subjectNode.children?.length || 0} فصول
                  </span>
                  {isSubExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
                </div>

                <div className="flex items-center gap-1.5 no-print">
                  <button 
                    onClick={() => handleAddNode(subjectNode.id, 'chapter')}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                    title="إضافة فصل جديد"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => startEdit(subjectNode)}
                    className="p-1.5 text-[#5B2596] hover:bg-purple-50 rounded-xl"
                    title="تعديل اسم المادة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => deleteNode(subjectNode)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl"
                    title="حذف المادة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CHAPTERS list */}
              {isSubExpanded && (
                <div className="space-y-2 pr-2">
                  {subjectNode.children && subjectNode.children.length > 0 ? (
                    subjectNode.children.map((chapterNode, chapIdx) => {
                      const isChapExpanded = !!expandedNodes[chapterNode.id];
                      const isLastChap = chapIdx === subjectNode.children!.length - 1;
                      const chapPrefix = isLastChap ? '└─ ' : '├─ ';
                      
                      return (
                        <div key={chapterNode.id} className="space-y-1">
                          {/* CHAPTER HEADER */}
                          <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                            <div 
                              onClick={() => toggleExpand(chapterNode.id)}
                              className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0"
                            >
                              <span className="text-[#7641B4] font-mono text-xs font-bold shrink-0">{chapPrefix}</span>
                              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="text-xs font-bold text-[#1D2433] truncate">{chapterNode.name}</span>
                              <span className="text-[9px] text-[#687084] shrink-0">({chapterNode.children?.length || 0} دروس)</span>
                              {isChapExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronLeft className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                            </div>

                            <div className="flex items-center gap-1 no-print shrink-0">
                              <button 
                                onClick={() => handleAddNode(chapterNode.id, 'lesson')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="إضافة درس جديد بالفصل"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => startEdit(chapterNode)}
                                className="p-1 text-[#5B2596] hover:bg-purple-50 rounded"
                                title="تعديل اسم الفصل"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => deleteNode(chapterNode)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="حذف الفصل"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* LESSONS list */}
                          {isChapExpanded && (
                            <div className="space-y-1 pr-6">
                              {chapterNode.children && chapterNode.children.length > 0 ? (
                                chapterNode.children.map((lessonNode, lessIdx) => {
                                  const isLastLess = lessIdx === chapterNode.children!.length - 1;
                                  const lessPrefix = isLastLess ? '   └── ' : '   ├── ';
                                  const isSelected = selectedLessonId === lessonNode.id;
                                  
                                  return (
                                    <div 
                                      key={lessonNode.id} 
                                      className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-[#E9E6FA] border border-[#5B2596]/40 shadow-sm' 
                                          : 'hover:bg-slate-50'
                                      }`}
                                      onClick={() => setSelectedLessonId(lessonNode.id)}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className="text-[#687084] font-mono text-xs font-bold shrink-0">{lessPrefix}</span>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCompletion(lessonNode.id);
                                          }} 
                                          className="text-gray-400 hover:text-[#5B2596] shrink-0"
                                        >
                                          {lessonNode.completed ? (
                                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                                          ) : (
                                            <Square className="w-4 h-4" />
                                          )}
                                        </button>
                                        <FileText className={`w-3.5 h-3.5 shrink-0 ${lessonNode.completed ? 'text-emerald-500' : 'text-sky-500'}`} />
                                        <span className={`text-xs font-semibold truncate ${lessonNode.completed ? 'line-through text-gray-400' : 'text-[#1D2433]'}`}>
                                          {lessonNode.name}
                                        </span>
                                      </div>

                                      {/* Quick small indicators */}
                                      <div className="flex items-center gap-1.5 shrink-0 pr-2">
                                        {lessonNode.masteryPercentage !== undefined && (
                                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                            lessonNode.masteryPercentage >= 80 
                                              ? 'bg-emerald-100 text-emerald-800' 
                                              : lessonNode.masteryPercentage >= 50 
                                                ? 'bg-amber-100 text-amber-800' 
                                                : 'bg-rose-100 text-rose-800'
                                          }`}>
                                            {lessonNode.masteryPercentage}% إتقان
                                          </span>
                                        )}
                                        
                                        <div className="opacity-0 group-hover:opacity-100 md:opacity-100 flex items-center gap-1 no-print">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEdit(lessonNode);
                                            }}
                                            className="p-1 text-[#5B2596] hover:bg-purple-100 rounded"
                                            title="تعديل اسم الدرس"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteNode(lessonNode);
                                            }}
                                            className="p-1 text-rose-600 hover:bg-rose-100 rounded"
                                            title="حذف الدرس"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-[10px] text-gray-400 pr-8">لا توجد دروس مضافة بالفصل.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-gray-400 pr-6">لا توجد فصول مضافة بالمادة.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#3E176D] font-sans flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#5B2596]" />
            شجرة المنهج الوزاري
          </h2>
          <p className="text-xs text-[#687084] mt-1 font-semibold leading-relaxed">
            الشجرة التعليمية المتكاملة المخصصة للتحكم بالدروس والفصول والمهام ومستويات المذاكرة والأسئلة الوزارية.
          </p>
        </div>

        <button
          onClick={() => handleAddNode(null, 'subject')}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#5B2596] hover:bg-[#3E176D] rounded-2xl shadow-md transition-colors cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مادة مخصصة جديدة</span>
        </button>
      </div>

      {/* TOAST NOTIFICATION AND UNDO BANNER */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {deleteBackup && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold animate-in slide-in-from-top-1">
          <span className="text-rose-950 flex items-center gap-1.5">
            <Trash className="w-4 h-4 text-rose-600" />
            <span>تم حذف العنصر "{deleteBackup.deletedNode.name}". يمكنك التراجع عن الإجراء فوراً.</span>
          </span>
          <button
            onClick={undoDelete}
            className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-100 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تراجع الآن</span>
          </button>
        </div>
      )}

      {/* DOUBLE-COLUMN GRID: TREE VIEW ON LEFT/RIGHT, ACTIVE LESSON DETAILS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1 & 2: THE HIERARCHICAL TREE VIEW */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#F5F3FF]/40 border border-[#D9D3F0] rounded-3xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D3F0]/60 pb-3">
              <span className="text-xs font-black text-[#3E176D] font-sans">هيكل وتفريعات شجرة المنهج الوزاري</span>
              <span className="text-[10px] text-[#687084] font-semibold">اضغط على المادة أو الفصل لفتحه، ثم اختر أي درس لعرض تفاصيله بالجانب الأيسر.</span>
            </div>

            {tree.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-[#D9D3F0] rounded-2xl text-center space-y-4">
                <p className="text-xs text-gray-500 font-bold">لم تقم بإضافة أي مواد أو فصول في شجرة المنهج بعد.</p>
                <p className="text-[10px] text-gray-400">بإمكانك تعبئة الشجرة تلقائياً بضغطة واحدة بالمنهج العراقي المعتمد لصفك.</p>
                <button
                  onClick={() => {
                    localStorage.removeItem('madrasati_curriculum_tree_v2');
                    window.location.reload();
                  }}
                  className="px-5 py-2.5 bg-[#E9E6FA] text-[#3E176D] text-xs font-bold rounded-xl hover:bg-[#D9D3F0] transition-all"
                >
                  توليد المنهج الوزاري الافتراضي مجدداً
                </button>
              </div>
            ) : (
              renderTreeLayout()
            )}
          </div>
        </div>

        {/* COL 3: DETAIL PANEL OF SELECTED LESSON (تفاصيل الدرس المختار) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#D9D3F0] p-6 shadow-sm space-y-6 sticky top-4">
            <div className="border-b border-[#D9D3F0]/60 pb-3">
              <h3 className="font-black text-sm text-[#3E176D] font-sans flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#5B2596]" />
                لوحة تفاصيل الدرس والتحكم
              </h3>
              <p className="text-[10px] text-[#687084] mt-0.5">تفاصيل المذاكرة، عدد الأسئلة ونسبة الإتقان وتسكين الجدول.</p>
            </div>

            {selectedLessonNode ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Lesson Name */}
                <div className="p-4 bg-[#F5F3FF] rounded-2xl border border-[#D9D3F0]/50 space-y-2">
                  <span className="text-[10px] text-[#5B2596] font-bold block">موضوع المذاكرة الحالي</span>
                  <p className="text-xs font-extrabold text-[#3E176D] leading-relaxed">{selectedLessonNode.name}</p>
                </div>

                {/* Tracking Form Fields */}
                <div className="space-y-4">
                  {/* Status switcher */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#687084] mb-1.5">حالة مذاكرة الدرس</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateLessonProperty(selectedLessonNode.id, 'completed', true)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          selectedLessonNode.completed 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                        }`}
                      >
                        ✅ مكتمل ومتقن
                      </button>
                      <button
                        onClick={() => updateLessonProperty(selectedLessonNode.id, 'completed', false)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          !selectedLessonNode.completed 
                            ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                        }`}
                      >
                        ⏳ بانتظار المذاكرة
                      </button>
                    </div>
                  </div>

                  {/* Review count counter */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-gray-100">
                    <div>
                      <span className="block text-xs font-bold text-[#1D2433]">تكرار المراجعة الذهبية</span>
                      <span className="text-[9px] text-[#687084]">عدد مراجعاتك لهذا الموضوع</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const val = Math.max(0, (selectedLessonNode.reviewCount || 0) - 1);
                          updateLessonProperty(selectedLessonNode.id, 'reviewCount', val);
                        }}
                        className="w-7 h-7 bg-white hover:bg-slate-100 text-gray-700 font-bold rounded-lg border border-gray-200 text-xs"
                      >
                        -
                      </button>
                      <span className="font-black text-sm text-[#3E176D] w-6 text-center">
                        {selectedLessonNode.reviewCount || 0}
                      </span>
                      <button
                        onClick={() => {
                          const val = (selectedLessonNode.reviewCount || 0) + 1;
                          updateLessonProperty(selectedLessonNode.id, 'reviewCount', val);
                          // Auto set last review date to today
                          updateLessonProperty(selectedLessonNode.id, 'lastReviewDate', new Date().toISOString().split('T')[0]);
                        }}
                        className="w-7 h-7 bg-white hover:bg-slate-100 text-gray-700 font-bold rounded-lg border border-gray-200 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Last review date picker */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#687084] mb-1">تاريخ آخر مراجعة</label>
                    <input
                      type="text"
                      placeholder="مثال: 2026-07-01 أو اكتب لا يوجد"
                      value={selectedLessonNode.lastReviewDate || '—'}
                      onChange={(e) => updateLessonProperty(selectedLessonNode.id, 'lastReviewDate', e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-slate-50 font-medium text-slate-800"
                    />
                  </div>

                  {/* Question counts inside lesson */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#687084] mb-1">إجمالي الأسئلة المحلولة</label>
                      <input
                        type="number"
                        min="0"
                        value={selectedLessonNode.questionsCount || 0}
                        onChange={(e) => updateLessonProperty(selectedLessonNode.id, 'questionsCount', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-slate-50 font-medium text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#687084] mb-1">
                        الأسئلة الوزارية المحلولة
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={!isTerminalGrade}
                        title={!isTerminalGrade ? 'خاص بالصفوف المنتهية فقط' : ''}
                        value={selectedLessonNode.ministerialQuestionsCount || 0}
                        onChange={(e) => updateLessonProperty(selectedLessonNode.id, 'ministerialQuestionsCount', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-slate-50 font-medium text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Mastery level range slider */}
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">مستوى الإتقان والفهم</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        (selectedLessonNode.masteryPercentage || 0) >= 80 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : (selectedLessonNode.masteryPercentage || 0) >= 50 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        {selectedLessonNode.masteryPercentage || 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedLessonNode.masteryPercentage || 0}
                      onChange={(e) => updateLessonProperty(selectedLessonNode.id, 'masteryPercentage', parseInt(e.target.value) || 0)}
                      className="w-full accent-[#5B2596] cursor-pointer"
                    />
                    <span className="text-[9px] text-gray-400 block text-center">قم بتحريك المؤشر لتحديث نسبة فهمك للموضوع مهارياً.</span>
                  </div>
                </div>

                {/* Lesson-specific Actions: ADD TO SCHEDULE, COPY, MOVE */}
                <div className="space-y-2.5 pt-4 border-t border-gray-100 no-print">
                  {/* Schedule link trigger */}
                  {activeSchedule && (
                    <button
                      onClick={() => setLinkingNode(selectedLessonNode)}
                      className="w-full py-2.5 bg-[#5B2596] text-white rounded-xl text-xs font-bold hover:bg-[#3E176D] transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>أضف هذا الدرس لجدولي التفاعلي</span>
                    </button>
                  )}

                  {/* Duplicate trigger */}
                  <button
                    onClick={() => duplicateLesson(selectedLessonNode)}
                    className="w-full py-2 bg-[#E9E6FA] text-[#3E176D] rounded-xl text-xs font-bold hover:bg-[#D9D3F0] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ وتكرار الدرس بالفصل</span>
                  </button>

                  {/* Reorder/Move lesson section */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-[#687084] mb-1">نقل الدرس لفصل آخر</label>
                    <div className="flex gap-1.5">
                      <select
                        value={moveTargetChapterId}
                        onChange={(e) => setMoveTargetChapterId(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-slate-800 outline-none"
                      >
                        <option value="">-- اختر فصل مستهدف --</option>
                        {getAllChapters(tree).map(ch => (
                          <option key={ch.id} value={ch.id}>
                            [{ch.subjectName}] - {ch.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (!moveTargetChapterId) {
                            showToast('الرجاء اختيار فصل مستهدف أولاً لنقل الدرس إليه.');
                            return;
                          }
                          setMovingLessonId(selectedLessonNode.id);
                        }}
                        className="px-3 bg-[#E9E6FA] text-[#3E176D] font-bold rounded-xl text-xs hover:bg-[#D9D3F0] transition-all"
                      >
                        نقل
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-3 bg-slate-50/50 rounded-3xl border border-dashed border-[#D9D3F0]">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">لا يوجد درس محدد حالياً</p>
                <p className="text-[10px] text-gray-400">انقر على أي درس دراسي في شجرة المنهج على اليمين لتفحّص تفاصيل مراجعته ومستوى إتقانه.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RENDER EDIT NAME OVERLAY MODAL */}
      {editingNodeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#D9D3F0] shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-extrabold text-xs text-[#3E176D]">تعديل مسمى العنصر في المنهج</span>
              <button onClick={() => setEditingNodeId(null)} className="text-gray-500 hover:text-black font-bold">×</button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1.5">الاسم الجديد</label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#7641B4] bg-slate-50 font-bold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveNodeName();
                  if (e.key === 'Escape') setEditingNodeId(null);
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setEditingNodeId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                إلغاء
              </button>
              <button
                onClick={saveNodeName}
                className="px-4 py-2 text-xs font-bold text-white bg-[#5B2596] rounded-xl hover:opacity-95"
              >
                تأكيد وتحديث الاسم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MOVE OVERLAY MODAL */}
      {movingLessonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#D9D3F0] shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-extrabold text-xs text-[#3E176D]">تأكيد نقل الدرس</span>
              <button onClick={() => setMovingLessonId(null)} className="text-gray-500 hover:text-black font-bold">×</button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من رغبتك في نقل هذا الدرس المحدد بشكل كامل إلى الفصل الدراسي المستهدف؟ سيتم المحافظة على جميع مستويات الإتقان والمراجعة الحالية.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setMovingLessonId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                إلغاء النقل
              </button>
              <button
                onClick={handleMoveLesson}
                className="px-4 py-2 text-xs font-bold text-white bg-[#5B2596] rounded-xl hover:opacity-95"
              >
                نقل الدرس الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LINK TO SCHEDULE MODAL */}
      {linkingNode && activeSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#D9D3F0] shadow-2xl p-6 max-w-md w-full space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-extrabold text-sm text-[#3E176D] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                تسكين وجدولة الدرس بالجدول النشط
              </span>
              <button onClick={() => setLinkingNode(null)} className="text-gray-500 hover:text-black font-bold">×</button>
            </div>

            <div className="p-3 bg-[#F5F3FF] rounded-xl text-xs space-y-1">
              <div className="font-bold text-[#3E176D]">محتوى الدرس المستورد:</div>
              <div className="text-gray-700 font-semibold">{linkingNode.name}</div>
            </div>

            <p className="text-[10px] text-gray-500">اختر اليوم والوقت في جدولك التفاعلي لتسكين هذا الدرس داخله بضغطة واحدة وتتبع تقدمك المباشر.</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">اليوم المستهدف</label>
                <select
                  value={linkDayIdx}
                  onChange={(e) => setLinkDayIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                >
                  {activeSchedule.days.map((day, idx) => (
                    <option key={day} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">الوقت المستهدف</label>
                <select
                  value={linkLessonIdx}
                  onChange={(e) => setLinkLessonIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs"
                >
                  {activeSchedule.lessons.map((less, idx) => (
                    <option key={less} value={idx}>{less}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setLinkingNode(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                إلغاء
              </button>
              <button
                onClick={handleLinkToSchedule}
                className="px-4 py-2 text-xs font-bold text-white bg-[#5B2596] rounded-xl hover:opacity-95 animate-pulse"
              >
                تأكيد التسكين بالجدول الدراسي
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
