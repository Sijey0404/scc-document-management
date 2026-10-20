import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

type FormData = {
  title: string;
  description: string;
  selectedDepartment: string;
  selectedCategory: string;
  selectedFolder: string;
  files: File[];
};

type FormOptions = {
  departments: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  folderOptions: { id: string; name: string; deadline: string | null }[];
};

export const useDocumentSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form options (departments, categories, folders)
  const [formOptions, setFormOptions] = useState<FormOptions>({
    departments: [],
    categories: [],
    folderOptions: []
  });
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    selectedDepartment: "",
    selectedCategory: "",
    selectedFolder: "",
    files: []
  });
  
  const [fileError, setFileError] = useState("");

  // Update individual form fields
  const updateFormField = (field: keyof FormData, value: string | File[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    // If there's no user, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Fetch departments, categories, and folders
    const fetchOptions = async () => {
      try {
        // Fetch departments
        const { data: departmentData, error: deptError } = await supabase
          .from('departments')
          .select('id, name');
        
        if (deptError) throw deptError;
        if (departmentData) {
          // Sort departments to ensure "Information Technology" is first
          const sortedDepartments = [...departmentData].sort((a, b) => {
            if (a.name === "Information Technology") return -1;
            if (b.name === "Information Technology") return 1;
            return a.name.localeCompare(b.name);
          });
          
          setFormOptions(prev => ({ ...prev, departments: sortedDepartments }));
          
          // If user has a department, set it as default
          if (profile?.department_id) {
            updateFormField("selectedDepartment", profile.department_id);
          }
        }
        
        // Fetch categories
        const { data: categoryData, error: catError } = await supabase
          .from('document_categories')
          .select('id, name');
        
        if (catError) throw catError;
        if (categoryData) {
          setFormOptions(prev => ({ ...prev, categories: categoryData }));
        }
        
        // Fetch folders (using document_categories with deadline as folders)
        const { data: folderData, error: folderError } = await supabase
          .from('document_categories')
          .select('id, name, deadline');
        
        if (folderError) throw folderError;
        if (folderData) {
          setFormOptions(prev => ({ ...prev, folderOptions: folderData }));
        }
      } catch (error: any) {
        console.error("Error fetching form options:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load form options",
          variant: "destructive",
        });
      }
    };
    
    fetchOptions();
  }, [user, profile, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    setFileError("");
    
    if (selectedFiles.length === 0) {
      updateFormField("files", []);
      return;
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    const invalidSizeFile = selectedFiles.find(file => file.size > 10 * 1024 * 1024);
    if (invalidSizeFile) {
      setFileError(`${invalidSizeFile.name} exceeds the 10MB limit.`);
      updateFormField("files", []);
      return;
    }

    const invalidTypeFile = selectedFiles.find(file => !validTypes.includes(file.type));
    if (invalidTypeFile) {
      setFileError(`${invalidTypeFile.name} has an invalid file type. Please upload a PDF, Word document, Excel spreadsheet, or image.`);
      updateFormField("files", []);
      return;
    }

    updateFormField("files", selectedFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit documents",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (formData.files.length === 0) {
      setFileError("Please select at least one file to upload");
      return;
    }
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Document title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.selectedDepartment) {
      toast({
        title: "Error",
        description: "Department is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.selectedCategory) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    let submittedCount = 0;

    try {
      for (const file of formData.files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${formData.selectedDepartment}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const fileTitle = formData.files.length === 1
          ? formData.title
          : `${formData.title} - ${file.name.replace(/\.[^/.]+$/, "")}`;
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            title: fileTitle,
            description: formData.description || null,
            submitted_by: user.id,
            department_id: formData.selectedDepartment,
            category_id: formData.selectedCategory,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            status: "PENDING"
          });

        if (insertError) throw insertError;
        submittedCount += 1;
      }
      
      toast({
        title: "Document submitted",
        description: `${submittedCount} document${submittedCount === 1 ? "" : "s"} submitted successfully`,
      });
      
      navigate('/documents');
    } catch (error: unknown) {
      console.error("Error submitting document:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Failed to submit document";
      toast({
        title: "Error",
        description: `${errorMessage}${submittedCount > 0 ? ` (${submittedCount} of ${formData.files.length} files were submitted)` : ""}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFolderDeadlineInfo = (folderId: string) => {
    if (folderId === "none") return null;
    
    const selectedFolder = formOptions.folderOptions.find(folder => folder.id === folderId);
    if (!selectedFolder || !selectedFolder.deadline) return null;
    
    return new Date(selectedFolder.deadline).toLocaleString();
  };

  return {
    formData,
    formOptions,
    updateFormField,
    fileError,
    isSubmitting,
    handleFileChange,
    handleSubmit,
    getFolderDeadlineInfo
  };
};
