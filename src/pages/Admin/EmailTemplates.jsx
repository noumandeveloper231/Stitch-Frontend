import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Mail, Pencil, Save } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/errors";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { Label } from "@radix-ui/react-label";
import { useAuth } from "../../context/AuthContext";

export default function EmailTemplates() {
  const { user, can } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [testSendingKey, setTestSendingKey] = useState(null);
  const [activeInsertTarget, setActiveInsertTarget] = useState("subject");
  const [formData, setFormData] = useState({
    templateName: "",
    enabled: true,
    subject: "",
    body: "",
  });
  const subjectRef = useRef(null);
  const editorRef = useRef(null);
  const modalContentRef = useRef(null);
  const tinyMCEKey = import.meta.env.VITE_TINYMCE_API_KEY;

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get("/email-templates");
      setTemplates(data.data || []);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      templateName: template.templateName || "",
      enabled: Boolean(template.enabled),
      subject: template.subject || "",
      body: template.body || "",
    });
    setActiveInsertTarget("subject");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    if (!formData.templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (!formData.subject.trim() || !formData.body.trim()) {
      toast.error("Subject and body are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        templateName: formData.templateName.trim(),
        enabled: formData.enabled,
        subject: formData.subject,
        body: formData.body,
      };
      await api.put(`/email-templates/${editingTemplate.key}`, payload);
      toast.success("Template updated");
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const insertIntoSubject = (token) => {
    const input = subjectRef.current;
    if (!input) {
      setFormData((prev) => ({ ...prev, subject: `${prev.subject}${token}` }));
      return;
    }
    const start = input.selectionStart ?? formData.subject.length;
    const end = input.selectionEnd ?? start;
    const next =
      formData.subject.slice(0, start) + token + formData.subject.slice(end);
    setFormData((prev) => ({ ...prev, subject: next }));

    requestAnimationFrame(() => {
      const caret = start + token.length;
      input.focus();
      input.setSelectionRange(caret, caret);
    });
  };

  const onDragStartPlaceholder = (event, token) => {
    event.dataTransfer.setData("text/plain", token);
    event.dataTransfer.effectAllowed = "copy";
  };

  const onSubjectDrop = (event) => {
    event.preventDefault();
    const token = event.dataTransfer.getData("text/plain");
    if (!token) return;
    insertIntoSubject(token);
  };

  const sendTestEmail = useCallback(
    async (key) => {
      if (!user?.email) {
        toast.error("Your account has no email address. Add one to your user profile before sending a test.");
        return;
      }
      setTestSendingKey(key);
      try {
        const { data } = await api.post(`/email-templates/${encodeURIComponent(key)}/test-send`);
        const sentTo = data?.data?.to ?? user.email;
        toast.success(`Test email sent to ${sentTo}`);
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setTestSendingKey(null);
      }
    },
    [user?.email],
  );

  const onPlaceholderClick = (token) => {
    const editor = editorRef.current;
    if (activeInsertTarget === "body" && editor) {
      editor.focus();
      editor.insertContent(editor.dom.encode(token));
      return;
    }
    insertIntoSubject(token);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "templateName",
        header: "Template Name",
        meta: { label: "Template Name" },
      },
      {
        accessorKey: "templateType",
        header: "Type",
        meta: { label: "Type" },
      },
      {
        accessorKey: "key",
        header: "Key",
        meta: { label: "Key" },
      },
      {
        id: "enabled",
        header: "Enabled",
        meta: { label: "Enabled" },
        cell: ({ row }) => (
          <span className={row.original.enabled ? "text-emerald-600" : "text-zinc-400"}>
            {row.original.enabled ? "Yes" : "No"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        filter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5">
            {can("Email Templates", "manage") ? (
              <button
                type="button"
                onClick={() => sendTestEmail(row.original.key)}
                disabled={testSendingKey === row.original.key}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-[var(--sf-accent)] transition-colors disabled:opacity-50"
                title="Send test email with sample data to your address"
              >
                <Mail size={16} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openEdit(row.original)}
              className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-[var(--sf-accent)] transition-colors"
              title="Edit template"
            >
              <Pencil size={16} />
            </button>
          </div>
        ),
      },
    ],
    [can, sendTestEmail, testSendingKey],
  );

  const typeOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set((templates || []).map((template) => template.templateType).filter(Boolean)),
    );
    return uniqueTypes.sort((a, b) => a.localeCompare(b));
  }, [templates]);

  // TinyMCE React resets the document (and caret) whenever `initialValue` changes; it must not
  // follow `onEditorChange` updates. Only refresh when opening the modal or switching template.
  const editorInitialBody = useMemo(
    () => formData.body,
    [editingTemplate?.key, showModal],
  );

  const filteredTemplates = useMemo(() => {
    return (templates || []).filter((template) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(template.templateName || "").toLowerCase().includes(q) ||
        String(template.key || "").toLowerCase().includes(q) ||
        String(template.subject || "").toLowerCase().includes(q);

      const matchesEnabled =
        enabledFilter === "all" ||
        (enabledFilter === "enabled" && template.enabled) ||
        (enabledFilter === "disabled" && !template.enabled);

      const matchesType =
        typeFilter === "all" || String(template.templateType || "") === typeFilter;

      return matchesSearch && matchesEnabled && matchesType;
    });
  }, [templates, searchQuery, enabledFilter, typeFilter]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Email Templates</h1>
        <p className="text-sm text-zinc-500">
          Edit default templates for system events. Creation and deletion are intentionally disabled.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          placeholder="Search by template, key, or subject..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <select
          className="h-10 rounded-lg border border-[#cdcdcd] bg-white px-3 text-sm shadow"
          value={enabledFilter}
          onChange={(event) => setEnabledFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
        <select
          className="h-10 rounded-lg border border-[#cdcdcd] bg-white px-3 text-sm shadow"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All Types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={filteredTemplates}
        isLoading={loading}
        enableSelection={false}
        fixedHeight={false}
        emptyMessage="No email templates found."
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        contentRef={modalContentRef}
        title={
          editingTemplate
            ? `Edit Template: ${editingTemplate.key}`
            : "Edit Template"
        }
        contentClassName="w-[95vw] max-w-4xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={submitting}>
              <Save size={16} />
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

          {/* Template Name */}
          <Input
            label="Template Name"
            value={formData.templateName}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                templateName: e.target.value,
              }))
            }
          />

          {/* Template Key */}
          <Input label="Template Key" value={editingTemplate?.key || ""} disabled />

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3">
            <div>
              <p className="text-sm font-medium text-zinc-700">Enabled</p>
              <p className="text-xs text-zinc-500">
                Disabled templates use fallback defaults.
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  enabled: Boolean(checked),
                }))
              }
            />
          </div>

          {/* Subject */}
          <Input
            label="Subject"
            ref={subjectRef}
            value={formData.subject}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                subject: e.target.value,
              }))
            }
            onFocus={() => setActiveInsertTarget("subject")}
            onDrop={onSubjectDrop}
            onDragOver={(event) => event.preventDefault()}
          />

          {/* Body Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Body</label>

            <Editor
              key={editingTemplate?.key}
              apiKey={tinyMCEKey}
              initialValue={editorInitialBody}
              onInit={(_, editor) => {
                editorRef.current = editor;
                const root = modalContentRef.current;
                if (root && typeof editor.options?.set === "function") {
                  editor.options.set("ui_container", root);
                }
              }}
              init={{
                height: 320,
                menubar: false,
                branding: false,
                plugins: ["advlist", "autolink", "lists", "link", "table", "code"],
                toolbar:
                  "undo redo | bold italic underline | bullist numlist | link table | removeformat code",
                setup: (editor) => {
                  editor.on("focus", () => setActiveInsertTarget("body"));

                  editor.on("dragover", (event) => {
                    event.preventDefault();
                  });

                  editor.on("drop", (event) => {
                    const token = event.dataTransfer?.getData("text/plain");
                    if (!token) return;

                    event.preventDefault();
                    editor.insertContent(editor.dom.encode(token));
                  });
                },
              }}
              onEditorChange={(content) =>
                setFormData((prev) => ({ ...prev, body: content }))
              }
            />
          </div>

          {/* Placeholders */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-700">
              Placeholders
            </Label>

            <div className="flex flex-wrap gap-3 rounded-md border border-zinc-200 bg-white p-3">
              {(editingTemplate?.placeholders || []).map((token) => (
                <button
                  key={token}
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    onDragStartPlaceholder(event, token)
                  }
                  onClick={() => onPlaceholderClick(token)}
                  className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-900"
                  title="Drag and drop into Subject or Body"
                >
                  {token}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500">
              Placeholders are fixed by system defaults. Drag a pill into
              Subject or Body to insert.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
