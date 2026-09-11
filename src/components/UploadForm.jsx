import { useState, useEffect, Fragment, useMemo } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { FaCheckCircle, FaLaptop, FaMobileAlt, FaLink, FaTrash, FaSave } from 'react-icons/fa';

const UploadForm = ({ id = "", onSubmit, onUpdate, initialData = {} }) => {
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [initialUrl, setInitialUrl] = useState("");
  const [existingVideoId, setExistingVideoId] = useState(null); 
  const [initialUiStyle, setInitialUiStyle] = useState("horizontal");
  const [uiStyle, setUiStyle] = useState("horizontal");
  const [errMsg, setErrMsg] = useState("");
  const [isLoading, setIsLoading] = useState(!!initialData?.video);

  const axiosPrivate = useAxiosPrivate();

  useEffect(() => {
    if (initialData?.video) {
      const videoId = String(initialData.video);
      const style = initialData.ui_style || "horizontal";
      const fullUrl = `https://vimeo.com/${videoId}/7368c5ee7f?fl=ip&fe=ec`;
      
      setExistingVideoId(videoId);
      setInitialUiStyle(style);
      setUiStyle(style);
      setVimeoUrl(fullUrl);
      setInitialUrl(fullUrl);
      setIsLoading(false);
    } else {
      setExistingVideoId(null);
      setIsLoading(false);
    }
  }, [initialData]);

  const extractVimeoId = (url) => {
    if (!url) return "";
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match && match[1]) return match[1];
    if (/^\d+$/.test(url)) return url;
    return "";
  };

  const currentVideoId = useMemo(() => extractVimeoId(vimeoUrl), [vimeoUrl]);

  const isChanged = useMemo(() => {
    if (!existingVideoId) return false;
    return vimeoUrl !== initialUrl || uiStyle !== initialUiStyle;
  }, [vimeoUrl, initialUrl, uiStyle, initialUiStyle, existingVideoId]);

  const handleRemove = async () => {
    if (id && existingVideoId) {
      const confirmDelete = window.confirm("Are you sure you want to remove this video from the lesson?");
      if (!confirmDelete) return;

      try {
        setErrMsg("");
        const response = await axiosPrivate.delete(`/api/v1/admin/video/${id}`);
        if (response.data?.isSuccess) {
          setExistingVideoId(null);
          setVimeoUrl("");
          setInitialUrl("");
        } else {
          throw new Error(response.data?.message || "Failed to remove video");
        }
      } catch (error) {
        setErrMsg(error.response?.data?.message || "Failed to remove video");
      }
    } else {
      setVimeoUrl("");
    }
  };

  const handleSubmitInternal = (e) => {
    e.preventDefault();
    if (!currentVideoId) {
      setErrMsg("Please enter a valid Vimeo URL or ID.");
      return;
    }
    
    if (existingVideoId) {
      onUpdate(id, currentVideoId, uiStyle);
    } else {
      onSubmit(id, currentVideoId, uiStyle); 
    }
  };

  return (
    <Fragment>
      <div className="space-y-8">
        {errMsg && (
          <div className="px-4 py-3 text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <p className="font-medium">{errMsg}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-600 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmitInternal} className="space-y-8">
            {/* Layout Selection */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaLaptop className="text-emerald-600" />
                Step 1: Select Layout Style
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'horizontal', icon: FaLaptop, label: 'Horizontal', desc: 'Best for TV/Laptop' },
                  { id: 'vertical', icon: FaMobileAlt, label: 'Vertical', desc: 'Best for Mobile' }
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setUiStyle(style.id)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      uiStyle === style.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                        : "border-gray-200 bg-white text-gray-500 hover:border-emerald-200"
                    }`}
                  >
                    <style.icon className="text-3xl" />
                    <div className="text-center">
                      <p className="font-bold">{style.label}</p>
                      <p className="text-[10px] opacity-75">{style.desc}</p>
                    </div>
                    {uiStyle === style.id && <FaCheckCircle className="text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* URL Input */}
            <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaLink className="text-emerald-600" />
                Step 2: Paste Vimeo Link
              </h3>
              <div className="relative">
                <input
                  type="text"
                  value={vimeoUrl}
                  onChange={(e) => setVimeoUrl(e.target.value)}
                  placeholder="https://vimeo.com/..."
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-medium pr-12 text-gray-900"
                />
                {vimeoUrl && (
                  <button 
                    type="button"
                    onClick={() => setVimeoUrl("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              {(!existingVideoId || isChanged) && (
                <button 
                  type="submit"
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl text-xl uppercase tracking-widest transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                >
                  <FaSave />
                  {existingVideoId ? "Update Video" : "Save Video to Lesson"}
                </button>
              )}
              
              {existingVideoId && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                >
                  <FaTrash />
                  Delete Video from Lesson
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </Fragment>
  );
};

export default UploadForm;
