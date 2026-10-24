import { useState } from 'react';
import {
  Tags,
  Plus,
  Search,
  ShieldCheck,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
} from 'lucide-react';
import { adminComplaintService } from '../../services/adminComplaint.service';
import type { CategoryInfo, ComplaintCategory } from '../../types';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Modal,
  Textarea,
  Select,
  useToast,
} from '../../components/ui';

export function AdminCategoriesPage() {
  const { addToast } = useToast();
  const [categories, setCategories] = useState<CategoryInfo[]>(() =>
    adminComplaintService.getCategories()
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State for adding/editing category
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [formData, setFormData] = useState<CategoryInfo>({
    id: '' as ComplaintCategory,
    name: '',
    description: '',
    department: '',
    slaHours: 48,
    isActive: true,
  });

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase()) ||
      cat.department.toLowerCase().includes(search.toLowerCase()) ||
      cat.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? cat.isActive
        : !cat.isActive;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      id: '' as ComplaintCategory,
      name: '',
      description: '',
      department: '',
      slaHours: 48,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryInfo) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setModalOpen(true);
  };

  const handleToggleStatus = (cat: CategoryInfo) => {
    try {
      const updated = adminComplaintService.toggleCategoryStatus(cat.id);
      setCategories(updated);
      addToast({
        title: 'Status Updated',
        message: `Category "${cat.name}" has been marked as ${
          cat.isActive ? 'Inactive' : 'Active'
        }.`,
        variant: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Update Failed',
        message: err.message || 'Could not update category status.',
        variant: 'error',
      });
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.id.trim() || !formData.department.trim()) {
      addToast({
        title: 'Missing Required Fields',
        message: 'Please provide Category Identifier, Title, and Assigned Department.',
        variant: 'error',
      });
      return;
    }

    try {
      const updated = adminComplaintService.manageCategory({
        ...formData,
        id: formData.id.toLowerCase().replace(/[^a-z0-9_]/g, '_') as ComplaintCategory,
      });
      setCategories(updated);
      setModalOpen(false);
      addToast({
        title: editingCategory ? 'Category Updated' : 'Category Registered',
        message: `Category "${formData.name}" has been successfully configured.`,
        variant: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Failed to Save Category',
        message: err.message || 'Error occurred while saving category.',
        variant: 'error',
      });
    }
  };

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const inactiveCategories = totalCategories - activeCategories;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D5]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF2EE] text-[#B8755D] border border-[#ECCEC4] mb-1 select-none">
            <Lock className="w-3 h-3 text-[#B8755D]" />
            <span>Administrative Taxonomy Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292F2B] tracking-tight">
            Grievance Category Registry
          </h1>
          <p className="text-xs text-[#68716A] mt-1 max-w-2xl leading-relaxed">
            Manage institutional complaint classification, dedicated oversight departments, SLA resolution targets, and active intake status.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAddModal}
          startIcon={<Plus className="w-4 h-4" />}
        >
          Add New Category
        </Button>
      </div>

      {/* 2. Security Policy Callout */}
      <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#365442] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-[#292F2B]">
            Institutional Access Control: Ordinary Students Cannot Modify Taxonomy
          </span>
          <p className="text-[#68716A] leading-relaxed">
            This registry governs the categories available across student submission forms. Access is enforced by server-side authorization middleware (<code className="font-mono text-[11px] bg-[#E6EDE5] px-1 py-0.5 rounded">requireRole(['admin', 'staff'])</code>).
          </p>
        </div>
      </div>

      {/* 3. Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#68716A]">Total Categories</span>
            <Tags className="w-4 h-4 text-[#365442]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#292F2B] block">{totalCategories}</span>
            <span className="text-[10px] text-[#8C948E]">Institutional categories in catalog</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#365442]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#365442]">Active for Submissions</span>
            <CheckCircle2 className="w-4 h-4 text-[#365442]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#365442] block">{activeCategories}</span>
            <span className="text-[10px] text-[#68716A]">Available in student intake form</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-[#B8755D]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#B8755D]">Suspended / Inactive</span>
            <XCircle className="w-4 h-4 text-[#B8755D]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#B8755D] block">{inactiveCategories}</span>
            <span className="text-[10px] text-[#68716A]">Intake temporarily disabled</span>
          </div>
        </Card>
      </div>

      {/* 4. Search and Status Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C948E]" />
            <Input
              type="text"
              placeholder="Search by category name, identifier, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({totalCategories})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active ({activeCategories})
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive ({inactiveCategories})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Category List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <Card
            key={cat.id}
            className={`transition-all duration-150 flex flex-col justify-between ${
              !cat.isActive ? 'opacity-70 bg-[#F7F4EC]/60 border-dashed' : 'hover:border-[#A7B8A5]'
            }`}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FAF8F3] text-[#68716A] border border-[#E5E0D5]">
                    {cat.id}
                  </span>
                  <CardTitle className="text-sm font-bold text-[#292F2B] mt-2 flex items-center gap-1.5">
                    {cat.name}
                  </CardTitle>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    cat.isActive
                      ? 'bg-[#E6EDE5] text-[#365442] border-[#A7B8A5]'
                      : 'bg-[#FAF2EE] text-[#B8755D] border-[#DEAF9F]'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <CardDescription className="text-xs text-[#68716A] mt-2 line-clamp-2">
                {cat.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              <div className="pt-2 border-t border-[#E5E0D5]/70 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#8C948E] block uppercase font-bold">
                    Oversight Unit
                  </span>
                  <div className="flex items-center gap-1 text-[#292F2B] font-medium truncate mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-[#365442] shrink-0" />
                    <span className="truncate">{cat.department}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#8C948E] block uppercase font-bold">
                    Target SLA
                  </span>
                  <div className="flex items-center gap-1 text-[#292F2B] font-medium mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#B8755D] shrink-0" />
                    <span>{cat.slaHours} Hours</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D5]/60 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(cat)}
                  startIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Edit Settings
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(cat)}
                  className={`text-xs ${
                    cat.isActive
                      ? 'text-[#B8755D] border-[#ECCEC4] hover:bg-[#FAF2EE]'
                      : 'text-[#365442] border-[#A7B8A5] hover:bg-[#E6EDE5]'
                  }`}
                >
                  {cat.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <Card className="p-8 text-center">
          <Tags className="w-8 h-8 text-[#8C948E] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#292F2B]">No categories match your filter</h3>
          <p className="text-xs text-[#68716A] mt-1">
            Try adjusting your search query or reset status filters.
          </p>
        </Card>
      )}

      {/* 6. Add/Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Register New Complaint Category'}
        description="Configure institutional classification parameters and target SLA thresholds."
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#292F2B] mb-1">
              Category Identifier Code <span className="text-[#B8755D]">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. laboratory_safety"
              value={formData.id}
              disabled={!!editingCategory}
              onChange={(e) => setFormData({ ...formData, id: e.target.value as ComplaintCategory })}
              className="font-mono text-xs"
            />
            <span className="text-[10px] text-[#68716A] mt-1 block">
              Unique programmatic identifier (lowercase alphanumeric with underscores).
            </span>
          </div>

          <div>
            <label className="block font-semibold text-[#292F2B] mb-1">
              Category Display Title <span className="text-[#B8755D]">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Laboratory Equipment & Safety"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#292F2B] mb-1">
              Assigned Directorate / Department <span className="text-[#B8755D]">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Dean of Science & Lab Operations"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#292F2B] mb-1">
                Resolution SLA Target (Hours)
              </label>
              <Input
                type="number"
                min="12"
                max="168"
                step="6"
                value={formData.slaHours}
                onChange={(e) => setFormData({ ...formData, slaHours: parseInt(e.target.value) || 48 })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#292F2B] mb-1">Operational Intake Status</label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.value === 'active' })
                }
                options={[
                  { label: 'Active (Open for Intake)', value: 'active' },
                  { label: 'Inactive (Disabled)', value: 'inactive' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#292F2B] mb-1">
              Description & Scope Guidelines
            </label>
            <Textarea
              rows={3}
              placeholder="Explain what types of grievances or inquiries fall under this classification..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingCategory ? 'Save Modifications' : 'Register Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
