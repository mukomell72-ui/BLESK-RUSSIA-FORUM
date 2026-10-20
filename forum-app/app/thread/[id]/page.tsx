import ForumApp from '@/components/ForumApp';
export default async function ThreadPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ForumApp initialThread={id}/>}